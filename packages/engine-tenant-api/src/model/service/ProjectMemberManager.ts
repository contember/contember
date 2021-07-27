import {
	AddProjectMemberCommand,
	AddProjectMemberCommandError,
	MembershipUpdateInput,
	RemoveProjectMemberCommand,
	RemoveProjectMemberResponse,
	UpdateProjectMemberCommand,
	UpdateProjectMemberResponse,
} from '../commands'
import { ProjectMembershipByIdentityQuery } from '../queries/ProjectMembershipByIdentityQuery'
import { Membership, MembershipVariable } from '../type/Membership'
import { ProjectMembersQuery } from '../queries/ProjectMembersQuery'
import { AddProjectMemberErrorCode } from '../../schema'
import { ProjectRolesByIdentityQuery } from '../queries'
import { AccessVerifier, PermissionActions, TenantRole } from '../authorization'
import { indexListBy, notEmpty } from '../../utils/array'
import { createSetMembershipVariables } from './membershipUtils'
import { ProjectRole } from '@contember/schema'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { DatabaseContext } from '../utils'

export class ProjectMemberManager {
	constructor(private readonly dbContext: DatabaseContext) {}

	async getProjectRoles(projectId: string, identityId: string): Promise<GetProjectRolesResponse> {
		const row = await this.dbContext.queryHandler.fetch(new ProjectRolesByIdentityQuery({ id: projectId }, identityId))
		return new GetProjectRolesResponse(row.roles)
	}

	async getProjectBySlugRoles(projectSlug: string, identityId: string): Promise<GetProjectRolesResponse> {
		const row = await this.dbContext.queryHandler.fetch(
			new ProjectRolesByIdentityQuery({ slug: projectSlug }, identityId),
		)
		return new GetProjectRolesResponse(row.roles)
	}

	async addProjectMember(
		projectId: string,
		identityId: string,
		memberships: readonly Membership[],
	): Promise<AddProjectMemberResponse> {
		return await this.dbContext.transaction(async db => {
			const result = await db.commandBus.execute(
				new AddProjectMemberCommand(projectId, identityId, createSetMembershipVariables(memberships)),
			)
			if (result.ok) {
				return new ResponseOk(null)
			}
			switch (result.error) {
				case AddProjectMemberCommandError.alreadyMember:
					return new ResponseError(AddProjectMemberErrorCode.AlreadyMember, result.errorMessage)
				case AddProjectMemberCommandError.projectNotFound:
					return new ResponseError(AddProjectMemberErrorCode.ProjectNotFound, result.errorMessage)
				case AddProjectMemberCommandError.identityNotfound:
					return new ResponseError(AddProjectMemberErrorCode.IdentityNotFound, result.errorMessage)
			}
		})
	}

	async updateProjectMember(
		projectId: string,
		identityId: string,
		memberships: readonly MembershipUpdateInput[],
	): Promise<UpdateProjectMemberResponse> {
		return await this.dbContext.transaction(
			async db => await db.commandBus.execute(new UpdateProjectMemberCommand(projectId, identityId, memberships)),
		)
	}

	async removeProjectMember(projectId: string, identityId: string): Promise<RemoveProjectMemberResponse> {
		return await this.dbContext.transaction(
			async db => await db.commandBus.execute(new RemoveProjectMemberCommand(projectId, identityId)),
		)
	}

	async getProjectMemberships(
		project: { id: string } | { slug: string },
		identity: { id: string; roles?: string[] },
		verifier: AccessVerifier | undefined,
	): Promise<readonly Membership[]> {
		if (identity.roles?.includes(TenantRole.SUPER_ADMIN)) {
			return [{ role: ProjectRole.ADMIN, variables: [] }]
		}
		const memberships = await this.dbContext.queryHandler.fetch(
			new ProjectMembershipByIdentityQuery(project, [identity.id]),
		)
		if (verifier === undefined) {
			return memberships
		}
		return await this.filterMemberships(memberships, verifier)
	}

	async getProjectMembers(projectId: string, accessVerifier: AccessVerifier): Promise<GetProjectMembersResponse> {
		return this.dbContext.transaction(async db => {
			const members = await db.queryHandler.fetch(new ProjectMembersQuery(projectId))
			const memberships = await db.queryHandler.fetch(
				new ProjectMembershipByIdentityQuery(
					{ id: projectId },
					members.map(it => it.id),
				),
			)
			const filteredMemberships = await this.filterMemberships(memberships, accessVerifier)
			const byIdentity = indexListBy(filteredMemberships, 'identityId')
			return members
				.map(it => (byIdentity[it.id] ? { identity: it, memberships: byIdentity[it.id] } : null))
				.filter(notEmpty)
		})
	}

	private async filterMemberships<T extends Membership>(
		memberships: readonly T[],
		verifier: AccessVerifier,
	): Promise<T[]> {
		const filteredMemberships = await Promise.all(
			memberships.map(async membership => {
				if (!(await verifier(PermissionActions.PROJECT_VIEW_MEMBER([{ role: membership.role, variables: [] }])))) {
					return null
				}
				const variables = await Promise.all(
					membership.variables.map(async variable => {
						const values = await this.filterProjectMembershipVariableValues(membership, variable, verifier)
						return { name: variable.name, values }
					}),
				)
				if (variables.find(it => it.values.length === 0)) {
					return null
				}
				return { ...membership, variables }
			}),
		)
		return filteredMemberships.filter(notEmpty)
	}

	private async filterProjectMembershipVariableValues(
		membership: Membership,
		variable: MembershipVariable,
		verifier: AccessVerifier,
	): Promise<MembershipVariable['values']> {
		const values = await Promise.all(
			variable.values.map(async (value): Promise<string | null> => {
				const subMembership = {
					role: membership.role,
					variables: [
						{
							name: variable.name,
							values: [value],
						},
					],
				}

				if (!(await verifier(PermissionActions.PROJECT_VIEW_MEMBER([subMembership])))) {
					return null
				}
				return value
			}),
		)
		return values.filter(notEmpty)
	}
}

export type AddProjectMemberResponse = Response<null, AddProjectMemberErrorCode>

export class GetProjectRolesResponse {
	constructor(public readonly roles: string[]) {}
}

export type GetProjectMembersResponse = {
	identity: { id: string }
	memberships: readonly Membership[]
}[]
