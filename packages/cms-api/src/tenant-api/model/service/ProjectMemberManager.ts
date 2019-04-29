import { AddProjectMemberErrorCode } from '../../schema/types'
import QueryHandler from '../../../core/query/QueryHandler'
import DbQueryable from '../../../core/knex/DbQueryable'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import ProjectRolesByIdentityQuery from '../queries/ProjectRolesByIdentityQuery'
import UpdateProjectMemberVariablesCommand from '../commands/UpdateProjectMemberVariablesCommand'
import ProjectVariablesByIdentityQuery from '../queries/ProjectVariablesByIdentityQuery'
import AddProjectMemberCommand from '../commands/AddProjectMemberCommand'

class ProjectMemberManager {
	constructor(private readonly queryHandler: QueryHandler<DbQueryable>, private readonly db: KnexWrapper) {}

	async getProjectRoles(projectId: string, identityId: string): Promise<ProjectMemberManager.GetProjectRolesResponse> {
		const row = await this.queryHandler.fetch(new ProjectRolesByIdentityQuery(projectId, identityId))
		return new ProjectMemberManager.GetProjectRolesResponse(row.roles)
	}

	async addProjectMember(
		projectId: string,
		identityId: string,
		roles: string[]
	): Promise<ProjectMemberManager.AddProjectMemberResponse> {
		return await new AddProjectMemberCommand(projectId, identityId, roles).execute(this.db)
	}

	async updateProjectMemberVariables(
		projectId: string,
		identityId: string,
		variables: ReadonlyArray<UpdateProjectMemberVariablesCommand.VariableUpdate>
	): Promise<UpdateProjectMemberVariablesCommand.UpdateProjectMemberVariablesResponse> {
		return await new UpdateProjectMemberVariablesCommand(projectId, identityId, variables).execute(this.db)
	}

	async getProjectVariables(projectId: string, identityId: string): Promise<ProjectVariablesByIdentityQuery.Result> {
		return this.queryHandler.fetch(new ProjectVariablesByIdentityQuery(projectId, identityId))
	}
}

namespace ProjectMemberManager {
	export type AddProjectMemberResponse = AddProjectMemberResponseOk | AddProjectMemberResponseError

	export class AddProjectMemberResponseOk {
		readonly ok = true

		constructor() {}
	}

	export class AddProjectMemberResponseError {
		readonly ok = false

		constructor(public readonly errors: Array<AddProjectMemberErrorCode>) {}
	}

	export class GetProjectRolesResponse {
		constructor(public readonly roles: string[]) {}
	}
}

export default ProjectMemberManager
