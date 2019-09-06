import { QueryHandler } from '@contember/queryable'
import { Client, DatabaseQueryable } from '@contember/database'
import {
	AddProjectMemberCommand,
	ProjectBySlugVariablesByIdentityQuery,
	ProjectRolesByIdentityQuery,
	RemoveProjectMemberCommand,
	UpdateProjectMemberCommand,
	UpdateProjectMembershipVariablesCommand,
} from '../'
import { CommandBus } from '../commands/CommandBus'
import { ProjectMembershipByIdentityQuery } from '../queries/ProjectMembershipByIdentityQuery'
import { Membership } from '../type/Membership'
import { PermissionContext } from '../authorization/PermissionContext'
import { ProjectMembersQuery } from '../queries/ProjectMembersQuery'

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
	): Promise<AddProjectMemberCommand.AddProjectMemberResponse> {
		return await this.commandBus.transaction(
			async bus => await bus.execute(new AddProjectMemberCommand(projectId, identityId, memberships)),
		)
	}

	async updateProjectMember(
		projectId: string,
		identityId: string,
		memberships: readonly Membership[],
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

	async getProjectBySlugVariables(
		projectSlug: string,
		identityId: string,
	): Promise<ProjectBySlugVariablesByIdentityQuery.Result> {
		return this.queryHandler.fetch(new ProjectBySlugVariablesByIdentityQuery(projectSlug, identityId))
	}

	async getProjectMemberships(projectId: string, identityId: string): Promise<ProjectMembershipByIdentityQuery.Result> {
		return this.queryHandler.fetch(new ProjectMembershipByIdentityQuery({ id: projectId }, identityId))
	}

	async getProjectBySlugMemberships(
		projectSlug: string,
		identityId: string,
	): Promise<ProjectMembershipByIdentityQuery.Result> {
		return this.queryHandler.fetch(new ProjectMembershipByIdentityQuery({ slug: projectSlug }, identityId))
	}

	async getProjectMembers(projectId: string): Promise<ProjectMemberManager.GetProjectMembersResponse> {
		const members = await this.queryHandler.fetch(new ProjectMembersQuery(projectId))

		return await Promise.all(members.map(async it => ({
			identity: it,
			memberships: await this.getProjectMemberships(projectId, it.id)
		})))
	}
}

namespace ProjectMemberManager {
	export class GetProjectRolesResponse {
		constructor(public readonly roles: string[]) {}
	}

	export type GetProjectMembersResponse = {
		identity: {id: string},
		memberships: readonly Membership[]
	}[]
}

export { ProjectMemberManager }
