import { QueryHandler } from '@contember/queryable'
import { Client, DatabaseQueryable } from '@contember/database'
import {
	AddProjectMemberCommand,
	ProjectBySlugVariablesByIdentityQuery,
	ProjectRolesByIdentityQuery,
	RemoveProjectMemberCommand,
	UpdateProjectMemberCommand,
	UpdateProjectMemberVariablesCommand,
} from '../'
import { CommandBus } from '../commands/CommandBus'

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
		roles: readonly string[],
		variables: readonly UpdateProjectMemberVariablesCommand.VariableUpdate[],
	): Promise<AddProjectMemberCommand.AddProjectMemberResponse> {
		return await this.commandBus.transaction(
			async bus => await bus.execute(new AddProjectMemberCommand(projectId, identityId, roles, variables)),
		)
	}

	async updateProjectMember(
		projectId: string,
		identityId: string,
		roles?: readonly string[],
		variables?: readonly UpdateProjectMemberVariablesCommand.VariableUpdate[],
	): Promise<UpdateProjectMemberCommand.UpdateProjectMemberResponse> {
		return await this.commandBus.transaction(
			async bus => await bus.execute(new UpdateProjectMemberCommand(projectId, identityId, roles, variables)),
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
}

namespace ProjectMemberManager {
	export class GetProjectRolesResponse {
		constructor(public readonly roles: string[]) {}
	}
}

export { ProjectMemberManager }
