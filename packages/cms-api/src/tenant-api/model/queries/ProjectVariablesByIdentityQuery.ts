import DbQuery from '../../../core/database/DbQuery'
import DbQueryable from '../../../core/database/DbQueryable'

class ProjectVariablesByIdentityQuery extends DbQuery<ProjectVariablesByIdentityQuery.Result> {
	constructor(private readonly projectId: string, private readonly identityId: string) {
		super()
	}

	async fetch(queryable: DbQueryable): Promise<ProjectVariablesByIdentityQuery.Result> {
		const result: Array<any> = await queryable
			.createSelectBuilder()
			.select('variable')
			.select('values')
			.from('project_member_variable')
			.where({
				identity_id: this.identityId,
				project_id: this.projectId,
			})
			.getResult()

		return result.reduce<ProjectVariablesByIdentityQuery.Result>(
			(result, row) => ({ ...result, [row.variable]: row.values }),
			{},
		)
	}
}

namespace ProjectVariablesByIdentityQuery {
	export type Result = { [name: string]: string[] }
}

export default ProjectVariablesByIdentityQuery
