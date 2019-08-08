import QueryHandler from '../../../core/query/QueryHandler'
import DbQueryable from '../../../core/database/DbQueryable'
import Client from '../../../core/database/Client'
import ProjectRolesByIdentityQuery from '../queries/ProjectRolesByIdentityQuery'
import UpdateProjectMemberCommand from '../commands/UpdateProjectMemberCommand'
import ProjectVariablesByIdentityQuery from '../queries/ProjectVariablesByIdentityQuery'
import AddProjectMemberCommand from '../commands/AddProjectMemberCommand'
import UpdateProjectMemberVariablesCommand from '../commands/UpdateProjectMemberVariablesCommand'
import RemoveProjectMemberCommand from '../commands/RemoveProjectMemberCommand'

class ProjectMemberManager {
	constructor(private readonly queryHandler: QueryHandler<DbQueryable>, private readonly db: Client) {}

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

export default ProjectMemberManager
