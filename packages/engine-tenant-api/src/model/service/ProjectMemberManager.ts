import { QueryHandler } from '@contember/queryable'
import { Client, DatabaseQueryable } from '@contember/database'
import {
	AddProjectMemberCommand,
	ProjectRolesByIdentityQuery,
	ProjectVariablesByIdentityQuery,
	RemoveProjectMemberCommand,
	UpdateProjectMemberCommand,
	UpdateProjectMemberVariablesCommand,
} from '../'

class ProjectMemberManager {
	constructor(private readonly queryHandler: QueryHandler<DatabaseQueryable>, private readonly db: Client) {}

	async getProjectRoles(projectId: string, identityId: string): Promise<ProjectMemberManager.GetProjectRolesResponse> {
		const row = await this.queryHandler.fetch(new ProjectRolesByIdentityQuery(projectId, identityId))
		return new ProjectMemberManager.GetProjectRolesResponse(row.roles)
	}

	async addProjectMember(
		projectId: string,
		identityId: string,
		roles: readonly string[],
		variables: readonly UpdateProjectMemberVariablesCommand.VariableUpdate[],
	): Promise<AddProjectMemberCommand.AddProjectMemberResponse> {
		return await this.db.transaction(
			async trx => await new AddProjectMemberCommand(projectId, identityId, roles, variables).execute(trx),
		)
	}

	async updateProjectMember(
		projectId: string,
		identityId: string,
		roles?: readonly string[],
		variables?: readonly UpdateProjectMemberVariablesCommand.VariableUpdate[],
	): Promise<UpdateProjectMemberCommand.UpdateProjectMemberResponse> {
		return await this.db.transaction(
			async trx => await new UpdateProjectMemberCommand(projectId, identityId, roles, variables).execute(trx),
		)
	}

	async removeProjectMember(
		projectId: string,
		identityId: string,
	): Promise<RemoveProjectMemberCommand.RemoveProjectMemberResponse> {
		return await this.db.transaction(
			async trx => await new RemoveProjectMemberCommand(projectId, identityId).execute(trx),
		)
	}

	async getProjectVariables(projectId: string, identityId: string): Promise<ProjectVariablesByIdentityQuery.Result> {
		return this.queryHandler.fetch(new ProjectVariablesByIdentityQuery(projectId, identityId))
	}
}

namespace ProjectMemberManager {
	export class GetProjectRolesResponse {
		constructor(public readonly roles: string[]) {}
	}
}

export { ProjectMemberManager }
