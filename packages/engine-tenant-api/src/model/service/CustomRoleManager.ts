import { DatabaseContext } from '../utils/index.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { CustomRolesQuery } from '../queries/index.js'
import { CreateCustomRoleCommand, DeleteCustomRoleCommand, UpdateCustomRoleCommand } from '../commands/index.js'
import { CustomRoleRow } from '../type/index.js'
import { BUILTIN_TENANT_ROLES, getGrantablePermissions } from '../authorization/CustomRolePermissions.js'
import { CreateCustomRoleErrorCode, DeleteCustomRoleErrorCode, UpdateCustomRoleErrorCode } from '../../schema/index.js'

const SLUG_PATTERN = /^[a-z][a-z0-9_]*$/
const SLUG_MAX_LENGTH = 64

/**
 * CRUD over the `custom_role` table — runtime-defined global roles carrying a bundle of
 * tenant permission actions. Assignment reuses `identity.roles` (addGlobalIdentityRoles);
 * evaluation happens in CustomRoleAccessEvaluator. Permissions are validated against the
 * grantable catalog (escalation vectors are never grantable, see CustomRolePermissions).
 */
export class CustomRoleManager {
	async listRoles(db: DatabaseContext): Promise<CustomRoleRow[]> {
		return db.queryHandler.fetch(new CustomRolesQuery())
	}

	async createRole(
		db: DatabaseContext,
		input: { slug: string; description: string | null; permissions: readonly string[] },
	): Promise<Response<{ id: string }, CreateCustomRoleErrorCode>> {
		if (!SLUG_PATTERN.test(input.slug) || input.slug.length > SLUG_MAX_LENGTH) {
			return new ResponseError('INVALID_SLUG', `Slug must match ${SLUG_PATTERN} and be at most ${SLUG_MAX_LENGTH} characters long`)
		}
		if (BUILTIN_TENANT_ROLES.has(input.slug)) {
			return new ResponseError('INVALID_SLUG', `Slug ${input.slug} collides with a built-in role`)
		}
		const permissionsError = this.validatePermissions(input.permissions)
		if (permissionsError !== null) {
			return permissionsError
		}
		// friendly pre-check; a concurrent insert is backstopped by the unique constraint
		const existing = await db.queryHandler.fetch(new CustomRolesQuery({ slugs: [input.slug] }))
		if (existing.length > 0) {
			return new ResponseError('SLUG_ALREADY_EXISTS', `Custom role ${input.slug} already exists`)
		}
		const id = await db.commandBus.execute(new CreateCustomRoleCommand(input))
		return new ResponseOk({ id })
	}

	async updateRole(
		db: DatabaseContext,
		slug: string,
		input: { description?: string | null; permissions?: readonly string[] },
	): Promise<Response<null, UpdateCustomRoleErrorCode>> {
		if (input.permissions !== undefined) {
			const permissionsError = this.validatePermissions(input.permissions)
			if (permissionsError !== null) {
				return permissionsError
			}
		}
		const updated = await db.commandBus.execute(new UpdateCustomRoleCommand(slug, input))
		if (!updated) {
			return new ResponseError('NOT_FOUND', `Custom role ${slug} not found`)
		}
		return new ResponseOk(null)
	}

	async deleteRole(db: DatabaseContext, slug: string): Promise<Response<null, DeleteCustomRoleErrorCode>> {
		const deleted = await db.commandBus.execute(new DeleteCustomRoleCommand(slug))
		if (!deleted) {
			return new ResponseError('NOT_FOUND', `Custom role ${slug} not found`)
		}
		return new ResponseOk(null)
	}

	private validatePermissions(permissions: readonly string[]): ResponseError<'UNKNOWN_PERMISSION'> | null {
		const grantable = getGrantablePermissions()
		for (const permission of permissions) {
			if (!grantable.has(permission)) {
				return new ResponseError('UNKNOWN_PERMISSION', `Permission ${permission} is unknown or not grantable to a custom role`)
			}
		}
		return null
	}
}
