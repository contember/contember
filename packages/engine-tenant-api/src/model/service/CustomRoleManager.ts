import { LockType, UniqueViolationError } from '@contember/database'
import { DatabaseContext } from '../utils/index.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { CustomRolesQuery, ProjectsQuery } from '../queries/index.js'
import { CreateCustomRoleCommand, DeleteCustomRoleCommand, RemoveCustomRoleAssignmentsCommand, UpdateCustomRoleCommand } from '../commands/index.js'
import { CustomRoleRow } from '../type/index.js'
import {
	BUILTIN_TENANT_ROLES,
	CanonicalCustomRoleGrant,
	CustomRoleGrantValidationError,
	parseCustomRoleGrants,
	parsePersistedCustomRoleGrants,
	parsePersistedCustomRoleReferences,
} from '../authorization/CustomRolePermissions.js'
import { ROLE_SLUG_PATTERN } from '../authorization/Roles.js'
import { CreateCustomRoleErrorCode, DeleteCustomRoleErrorCode, UpdateCustomRoleErrorCode } from '../../schema/index.js'
import { GlobalRoleValidator } from './GlobalRoleValidator.js'

const SLUG_MAX_LENGTH = 64

export type CustomRoleState = {
	readonly slug: string
	readonly description: string | null
	readonly grants: readonly CanonicalCustomRoleGrant[]
}

type CreateResult = {
	readonly id: string
	readonly role: CustomRoleState
}

type UpdateResult = {
	readonly before: CustomRoleState
	readonly after: CustomRoleState
}

type DeleteResult = {
	readonly before: CustomRoleState
	readonly removedAssignments: number
	/** Which identities lost the role — a count alone cannot answer "who lost what" after the fact. */
	readonly removedAssignmentIdentityIds: readonly string[]
}

export class CustomRoleManager {
	constructor(
		private readonly globalRoleValidator: GlobalRoleValidator = new GlobalRoleValidator(),
	) {
	}

	async listRoles(db: DatabaseContext): Promise<CustomRoleState[]> {
		const rows = await db.queryHandler.fetch(new CustomRolesQuery())
		return rows.map(row => this.toState(row))
	}

	async createRole(
		db: DatabaseContext,
		input: { slug: string; description: string | null; grants: unknown },
	): Promise<Response<CreateResult, CreateCustomRoleErrorCode>> {
		if (!ROLE_SLUG_PATTERN.test(input.slug) || input.slug.length > SLUG_MAX_LENGTH) {
			return new ResponseError('INVALID_SLUG', `Slug must match ${ROLE_SLUG_PATTERN} and be at most ${SLUG_MAX_LENGTH} characters long`)
		}
		if (BUILTIN_TENANT_ROLES.has(input.slug)) {
			return new ResponseError('INVALID_SLUG', `Slug ${input.slug} collides with a built-in role`)
		}
		const parsed = this.parseGrants(input.grants)
		if (parsed instanceof ResponseError) {
			return parsed
		}
		const referenceError = await this.validateReferences(db, parsed.referencedRoles, parsed.referencedProjects, new Set([input.slug]))
		if (referenceError !== null) {
			return referenceError
		}
		const existing = await db.queryHandler.fetch(new CustomRolesQuery({ slugs: [input.slug] }))
		if (existing.length > 0) {
			return new ResponseError('SLUG_ALREADY_EXISTS', `Custom role ${input.slug} already exists`)
		}
		// A racing INSERT aborts the transaction, so UniqueViolationError cannot be mapped
		// here — the caller catches it outside, once the transaction has rolled back.
		const id = await db.commandBus.execute(
			new CreateCustomRoleCommand({
				slug: input.slug,
				description: input.description,
				grants: parsed.grants,
			}),
		)
		return new ResponseOk({
			id,
			role: {
				slug: input.slug,
				description: input.description,
				grants: parsed.grants,
			},
		})
	}

	/** Maps the racing-insert failure the transaction could not report itself. */
	static isSlugConflict(error: unknown): boolean {
		return error instanceof UniqueViolationError
	}

	async updateRole(
		db: DatabaseContext,
		slug: string,
		input: { description?: string | null; grants?: unknown },
	): Promise<Response<UpdateResult, UpdateCustomRoleErrorCode>> {
		const [current] = await db.queryHandler.fetch(new CustomRolesQuery({ slugs: [slug], lock: LockType.forUpdate }))
		if (current === undefined) {
			return new ResponseError('NOT_FOUND', `Custom role ${slug} not found`)
		}
		let canonicalGrants: readonly CanonicalCustomRoleGrant[] | undefined
		if (input.grants !== undefined) {
			const parsed = this.parseGrants(input.grants)
			if (parsed instanceof ResponseError) {
				return parsed
			}
			const referenceError = await this.validateReferences(db, parsed.referencedRoles, parsed.referencedProjects, new Set([slug]))
			if (referenceError !== null) {
				return referenceError
			}
			canonicalGrants = parsed.grants
		}
		const before = this.toState(current)
		const updated = await db.commandBus.execute(
			new UpdateCustomRoleCommand(slug, {
				description: input.description,
				grants: canonicalGrants,
			}),
		)
		if (!updated) {
			return new ResponseError('NOT_FOUND', `Custom role ${slug} not found`)
		}
		return new ResponseOk({
			before,
			after: {
				slug,
				description: input.description === undefined ? before.description : input.description,
				grants: canonicalGrants ?? before.grants,
			},
		})
	}

	async deleteRole(db: DatabaseContext, slug: string): Promise<Response<DeleteResult, DeleteCustomRoleErrorCode>> {
		const [current] = await db.queryHandler.fetch(new CustomRolesQuery({ slugs: [slug], lock: LockType.forUpdate }))
		if (current === undefined) {
			return new ResponseError('NOT_FOUND', `Custom role ${slug} not found`)
		}
		// References live inside an opaque jsonb blob — no FK can catch this. Read the other rows
		// unlocked: a concurrent create/update naming this slug holds FOR SHARE on the row we
		// already hold FOR UPDATE, so the two serialize without a second lock (and without the
		// deadlock a reversed acquisition order would invite).
		const referencedBy = (await db.queryHandler.fetch(new CustomRolesQuery()))
			.filter(row => row.slug !== slug && parsePersistedCustomRoleReferences(row.grants).includes(slug))
			.map(row => row.slug)
		if (referencedBy.length > 0) {
			return new ResponseError(
				'ROLE_IN_USE',
				`Custom role ${slug} is referenced by the grant configuration of ${referencedBy.join(', ')}`,
			)
		}
		const deleted = await db.commandBus.execute(new DeleteCustomRoleCommand(slug))
		if (!deleted) {
			return new ResponseError('NOT_FOUND', `Custom role ${slug} not found`)
		}
		const removedAssignmentIdentityIds = await db.commandBus.execute(new RemoveCustomRoleAssignmentsCommand(slug))
		return new ResponseOk({
			before: this.toState(current),
			removedAssignments: removedAssignmentIdentityIds.length,
			removedAssignmentIdentityIds,
		})
	}

	private parseGrants(
		grants: unknown,
	): ReturnType<typeof parseCustomRoleGrants> | ResponseError<'UNKNOWN_PERMISSION' | 'DUPLICATE_PERMISSION' | 'INVALID_PERMISSION_CONFIGURATION'> {
		try {
			return parseCustomRoleGrants(grants)
		} catch (error) {
			if (error instanceof CustomRoleGrantValidationError) {
				return new ResponseError(error.code, error.message)
			}
			throw error
		}
	}

	private async validateReferences(
		db: DatabaseContext,
		roles: readonly string[],
		projects: readonly string[],
		additionallyActiveRoles: ReadonlySet<string>,
	): Promise<ResponseError<'INVALID_PERMISSION_CONFIGURATION'> | null> {
		const invalidRole = await this.globalRoleValidator.findInvalidRole(db, roles, additionallyActiveRoles)
		if (invalidRole !== null) {
			return new ResponseError('INVALID_PERMISSION_CONFIGURATION', `Referenced role ${invalidRole} does not exist or is not globally assignable`)
		}
		if (projects.length > 0) {
			const existingProjects = new Set((await db.queryHandler.fetch(new ProjectsQuery())).map(project => project.slug))
			const missingProject = projects.find(project => !existingProjects.has(project))
			if (missingProject !== undefined) {
				return new ResponseError('INVALID_PERMISSION_CONFIGURATION', `Referenced project ${missingProject} does not exist`)
			}
		}
		return null
	}

	private toState(row: CustomRoleRow): CustomRoleState {
		return {
			slug: row.slug,
			description: row.description,
			grants: parsePersistedCustomRoleGrants(row.grants),
		}
	}
}
