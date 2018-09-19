import KnexConnection from '../../../core/knex/KnexConnection'
import { AddProjectMemberErrorCode } from '../../schema/types'
import QueryHandler from '../../../core/query/QueryHandler'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import * as uuid from 'uuid'

class ProjectMemberManager {
	constructor(private readonly queryHandler: QueryHandler<KnexQueryable>, private readonly db: KnexConnection) {}

	async addProjectMember(projectId: string, personId: string): Promise<ProjectMemberManager.AddProjectMemberResponse> {
		try {
			await this.db
				.queryBuilder()
				.into('tenant.project_member')
				.insert({
					id: uuid.v4(),
					project_id: projectId,
					person_id: personId,
				})

			return new ProjectMemberManager.AddProjectMemberResponseOk()
		} catch (e) {
			switch (e.constraint) {
				case 'project_member_project_id_fkey':
					return new ProjectMemberManager.AddProjectMemberResponseError([AddProjectMemberErrorCode.PROJECT_NOT_FOUND])

				case 'project_member_person_id_fkey':
					return new ProjectMemberManager.AddProjectMemberResponseError([AddProjectMemberErrorCode.PERSON_NOT_FOUND])

				case 'project_member_project_id_person_id':
					return new ProjectMemberManager.AddProjectMemberResponseError([AddProjectMemberErrorCode.ALREADY_MEMBER])

				default:
					throw e
			}
		}
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
}

export default ProjectMemberManager
