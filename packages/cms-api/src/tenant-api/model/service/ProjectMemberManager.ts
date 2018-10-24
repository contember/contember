import { AddProjectMemberErrorCode } from '../../schema/types'
import QueryHandler from '../../../core/query/QueryHandler'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import { uuid } from '../../../utils/uuid'
import ProjectRolesByIdentityQuery from '../queries/ProjectRolesByIdentityQuery'

class ProjectMemberManager {
	constructor(private readonly queryHandler: QueryHandler<KnexQueryable>, private readonly db: KnexWrapper) {}

	async addProjectMember(
		projectId: string,
		identityId: string
	): Promise<ProjectMemberManager.AddProjectMemberResponse> {
		try {
			await this.db
				.insertBuilder()
				.into('project_member')
				.values({
					id: uuid(),
					project_id: projectId,
					identity_id: identityId,
					roles: [],
				})
				.execute()

			return new ProjectMemberManager.AddProjectMemberResponseOk()
		} catch (e) {
			switch (e.constraint) {
				case 'project_member_project_id_fkey':
					return new ProjectMemberManager.AddProjectMemberResponseError([AddProjectMemberErrorCode.PROJECT_NOT_FOUND])

				case 'project_member_identity':
					return new ProjectMemberManager.AddProjectMemberResponseError([AddProjectMemberErrorCode.IDENTITY_NOT_FOUND])

				case 'project_member_project_identity':
					return new ProjectMemberManager.AddProjectMemberResponseError([AddProjectMemberErrorCode.ALREADY_MEMBER])

				default:
					throw e
			}
		}
	}

	async getProjectRoles(projectId: string, identityId: string): Promise<ProjectMemberManager.GetProjectRolesResponse> {
		const row = await this.queryHandler.fetch(new ProjectRolesByIdentityQuery(projectId, identityId))
		return new ProjectMemberManager.GetProjectRolesResponse(row.roles)
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
