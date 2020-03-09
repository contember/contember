import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import {
	AddProjectMemberCommand,
	AddProjectMemberCommandError,
	CommandBus,
	MembershipInput,
	MembershipUpdateInput,
	RemoveProjectMemberCommand,
	UpdateProjectMemberCommand,
} from '../commands'
import { ProjectMembershipByIdentityQuery } from '../queries/ProjectMembershipByIdentityQuery'
import { Membership, MembershipVariable } from '../type/Membership'
import { ProjectMembersQuery } from '../queries/ProjectMembersQuery'
import { AddProjectMemberErrorCode } from '../../schema'
import { ProjectRolesByIdentityQuery } from '../queries'
import { AccessVerifier, PermissionActions, TenantRole } from '../authorization'
import { ProjectRole } from '@contember/engine-common'
import { notEmpty } from '../../utils/array'
import { createSetMembershipVariables } from './membershipUtils'

class ProjectMemberManager {
	constructor(
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
		private readonly commandBus: CommandBus,
	) {}

	async getProjectRoles(projectId: string, identityId: string): Promise<ProjectMemberManager.GetProjectRolesResponse> {
		const row = await this.queryHandler.fetch(new ProjectRolesByIdentityQuery({ id: projectId }, identityId))
		return new ProjectMemberManager.GetProjectRolesResponse(row.roles)
	}

	async getProjectBySlugRoles(
		projectSlug: string,
		identityId: string,
	): Promise<ProjectMemberManager.GetProjectRolesResponse> {
		const row = await this.queryHandler.fetch(new ProjectRolesByIdentityQuery({ slug: projectSlug }, identityId))
		return new ProjectMemberManager.GetProjectRolesResponse(row.roles)
	}

	async addProjectMember(
		projectId: string,
		identityId: string,
		memberships: readonly Membership[],
	): Promise<AddProjectMemberResponse> {
		return await this.commandBus.transaction(async bus => {
			const result = await bus.execute(
				new AddProjectMemberCommand(projectId, identityId, createSetMembershipVariables(memberships)),
			)
			if (result.ok) {
				return new AddProjectMemberResponseOk()
			}
			switch (result.error) {
				case AddProjectMemberCommandError.alreadyMember:
					return new AddProjectMemberResponseError([AddProjectMemberErrorCode.AlreadyMember])
				case AddProjectMemberCommandError.projectNotFound:
					return new AddProjectMemberResponseError([AddProjectMemberErrorCode.ProjectNotFound])
				case AddProjectMemberCommandError.identityNotfound:
					return new AddProjectMemberResponseError([AddProjectMemberErrorCode.IdentityNotFound])
			}
		})
	}

	async updateProjectMember(
		projectId: string,
		identityId: string,
		memberships: readonly MembershipUpdateInput[],
	): Promise<UpdateProjectMemberCommand.UpdateProjectMemberResponse> {
		return await this.commandBus.transaction(
			async bus => await bus.execute(new UpdateProjectMemberCommand(projectId, identityId, memberships)),
		)
	}

	async removeProjectMember(
		projectId: string,
		identityId: string,
	): Promise<RemoveProjectMemberCommand.RemoveProjectMemberResponse> {
		return await this.commandBus.transaction(
			async bus => await bus.execute(new RemoveProjectMemberCommand(projectId, identityId)),
		)
	}

	async getProjectMemberships(
		project: { id: string } | { slug: string },
		identity: { id: string; roles?: string[] },
		verifier: AccessVerifier | undefined,
	): Promise<ProjectMembershipByIdentityQuery.Result> {
		if (identity.roles?.includes(TenantRole.SUPER_ADMIN)) {
			return [{ role: ProjectRole.ADMIN, variables: [] }]
		}
		const memberships = await this.queryHandler.fetch(new ProjectMembershipByIdentityQuery(project, identity.id))
		if (verifier === undefined) {
			return memberships
		}
		return await this.filterMemberships(memberships, verifier)
	}

	async getProjectMembers(
		projectId: string,
		accessVerifier: AccessVerifier,
	): Promise<ProjectMemberManager.GetProjectMembersResponse> {
		const members = await this.queryHandler.fetch(new ProjectMembersQuery(projectId))

		return (
			await Promise.all(
				members.map(async it => {
					const memberships = await this.getProjectMemberships({ id: projectId }, { id: it.id }, accessVerifier)
					if (memberships.length === 0) {
						return null
					}
					return {
						identity: it,
						memberships: memberships,
					}
				}),
			)
		).filter(notEmpty)
	}

	private async filterMemberships(memberships: readonly Membership[], verifier: AccessVerifier): Promise<Membership[]> {
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
				return { role: membership.role, variables }
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
			variable.values.map(
				async (value): Promise<string | null> => {
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
				},
			),
		)
		return values.filter(notEmpty)
	}
}

export type AddProjectMemberResponse = AddProjectMemberResponseOk | AddProjectMemberResponseError

export class AddProjectMemberResponseOk {
	readonly ok = true

	constructor() {}
}

export class AddProjectMemberResponseError {
	readonly ok = false

	constructor(public readonly errors: Array<AddProjectMemberErrorCode>) {}
}

namespace ProjectMemberManager {
	export class GetProjectRolesResponse {
		constructor(public readonly roles: string[]) {}
	}

	export type GetProjectMembersResponse = {
		identity: { id: string }
		memberships: readonly Membership[]
	}[]
}

export { ProjectMemberManager }
