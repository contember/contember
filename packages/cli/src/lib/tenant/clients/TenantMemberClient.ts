import { CliError, ExitCode } from '@contember/cli-common'
import {
	addProjectMemberError$$,
	addProjectMemberResponse$$,
	identity$,
	inviteError$$,
	type InviteOptions,
	inviteResponse$$,
	inviteResult$,
	membership$,
	type MembershipInput,
	mutation$,
	person$,
	project$,
	projectIdentityRelation$,
	type ProjectMembersFilter,
	query$,
	removeProjectMemberError$$,
	removeProjectMemberResponse$$,
	type UnmanagedInviteOptions,
	updateProjectMemberError$$,
	updateProjectMemberResponse$$,
	variableEntry$$,
} from '@contember/graphql-client-tenant'
import { TenantApiTransport } from '../TenantApiTransport.js'

export interface TenantMembershipVariable {
	name: string
	values: string[]
}

export interface TenantMembership {
	role: string
	variables: TenantMembershipVariable[]
}

/** One member of a project — the identity, the person behind it when there is one, and its memberships. */
export interface TenantProjectMember {
	identityId: string
	/** Null for an API key member — those have no person. */
	personId: string | null
	email: string | null
	name: string | null
	/** Identity label, the only human-readable name an API key member has. */
	description: string | null
	memberships: TenantMembership[]
}

export interface ListProjectMembersArgs {
	filter?: ProjectMembersFilter
	limit?: number
	offset?: number
}

export interface InviteArgs {
	projectSlug: string
	email: string
	name?: string
	memberships: readonly MembershipInput[]
	options?: InviteOptions
}

export interface UnmanagedInviteArgs {
	projectSlug: string
	email: string
	memberships: readonly MembershipInput[]
	options?: UnmanagedInviteOptions
}

export interface TenantInviteResult {
	personId: string
	identityId: string
	email: string | null
	name: string | null
	/** False when the person already existed and was only added to the project. */
	isNew: boolean
}

/** The part of an `InviteResponse` selection this client reads — shared by `invite` and `unmanagedInvite`. */
interface InviteResponsePayload {
	readonly ok: boolean
	readonly error?: { readonly code: string; readonly developerMessage: string } | null
	readonly result?: {
		readonly isNew: boolean
		readonly person: {
			readonly id: string
			readonly email?: string
			readonly name?: string
			readonly identity: { readonly id: string }
		}
	} | null
}

// Fetchers are immutable and reusable, so they are built once at module load.
const membershipFetcher = membership$.role.variables(variableEntry$$)
const projectMembershipsFetcher = query$.projectMemberships(membershipFetcher)
const projectMembersFetcher = query$.projectBySlug(
	project$.members(
		projectIdentityRelation$
			.identity(identity$.id.description.person(person$.id.email.name))
			.memberships(membershipFetcher),
	),
)
const inviteResultFetcher = inviteResult$.isNew.person(person$.id.email.name.identity(identity$.id))
const inviteFetcher = mutation$.invite(inviteResponse$$.error(inviteError$$).result(inviteResultFetcher))
const unmanagedInviteFetcher = mutation$.unmanagedInvite(inviteResponse$$.error(inviteError$$).result(inviteResultFetcher))
const addProjectMemberFetcher = mutation$.addProjectMember(addProjectMemberResponse$$.error(addProjectMemberError$$))
const updateProjectMemberFetcher = mutation$.updateProjectMember(updateProjectMemberResponse$$.error(updateProjectMemberError$$))
const removeProjectMemberFetcher = mutation$.removeProjectMember(removeProjectMemberResponse$$.error(removeProjectMemberError$$))

/** Project memberships and invites. */
export class TenantMemberClient {
	constructor(
		private readonly transport: TenantApiTransport,
	) {
	}

	public async listProjectMemberships(projectSlug: string, identityId: string): Promise<TenantMembership[]> {
		const result = await this.transport.exec(projectMembershipsFetcher, { projectSlug, identityId })
		return result.projectMemberships.map(toMembership)
	}

	/**
	 * Lists every member of a project. The tenant API answers with an empty list — not an error — when the
	 * caller lacks the `project.view members` permission, so an empty result is not proof the project is empty.
	 */
	public async listProjectMembers(projectSlug: string, { filter, limit, offset }: ListProjectMembersArgs = {}): Promise<TenantProjectMember[]> {
		const result = await this.transport.exec(projectMembersFetcher, { slug: projectSlug, input: { filter, limit, offset } })
		const project = result.projectBySlug
		if (!project) {
			throw new CliError(`Project ${projectSlug} was not found or is not visible to this token.`, {
				code: 'PROJECT_NOT_FOUND',
				exitCode: ExitCode.NotFound,
				details: { projectSlug },
			})
		}
		return project.members.map(member => ({
			identityId: member.identity.id,
			personId: member.identity.person?.id ?? null,
			email: member.identity.person?.email ?? null,
			name: member.identity.person?.name ?? null,
			description: member.identity.description ?? null,
			memberships: member.memberships.map(toMembership),
		}))
	}

	/** Invites a person, letting the tenant deliver the credentials by mail. */
	public async invite({ projectSlug, email, name, memberships, options }: InviteArgs): Promise<TenantInviteResult> {
		const result = await this.transport.exec(inviteFetcher, { projectSlug, email, name, memberships, options })
		return this.toInviteResult(result.invite, `invite(${email})`)
	}

	/** Invites a person without any mail — the caller supplies the password or the reset token hash. */
	public async unmanagedInvite({ projectSlug, email, memberships, options }: UnmanagedInviteArgs): Promise<TenantInviteResult> {
		const result = await this.transport.exec(unmanagedInviteFetcher, { projectSlug, email, memberships, options })
		return this.toInviteResult(result.unmanagedInvite, `unmanagedInvite(${email})`)
	}

	public async addProjectMember(projectSlug: string, identityId: string, memberships: readonly MembershipInput[]): Promise<void> {
		const result = await this.transport.exec(addProjectMemberFetcher, { projectSlug, identityId, memberships })
		this.transport.assertOk(result.addProjectMember, `addProjectMember(${identityId})`)
	}

	/** Replaces all memberships of an existing member — anything not passed is removed. */
	public async updateProjectMember(projectSlug: string, identityId: string, memberships: readonly MembershipInput[]): Promise<void> {
		const result = await this.transport.exec(updateProjectMemberFetcher, { projectSlug, identityId, memberships })
		this.transport.assertOk(result.updateProjectMember, `updateProjectMember(${identityId})`)
	}

	public async removeProjectMember(projectSlug: string, identityId: string): Promise<void> {
		const result = await this.transport.exec(removeProjectMemberFetcher, { projectSlug, identityId })
		this.transport.assertOk(result.removeProjectMember, `removeProjectMember(${identityId})`)
	}

	private toInviteResult(response: InviteResponsePayload | undefined, operation: string): TenantInviteResult {
		this.transport.assertOk(response, operation)
		const result = response?.result
		if (!result) {
			// assertOk throws on every failure, so an ok payload without a result is a broken response, not a user error
			throw new CliError(`${operation} reported success but returned no result.`, {
				code: 'TENANT_API_INVALID_RESPONSE',
				exitCode: ExitCode.InternalError,
				details: { operation },
			})
		}
		return {
			personId: result.person.id,
			identityId: result.person.identity.id,
			email: result.person.email ?? null,
			name: result.person.name ?? null,
			isNew: result.isNew,
		}
	}
}

const toMembership = (membership: { role: string; variables: readonly { name: string; values: readonly string[] }[] }): TenantMembership => ({
	role: membership.role,
	variables: membership.variables.map(variable => ({ name: variable.name, values: [...variable.values] })),
})
