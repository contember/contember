import { DatabaseQuery, DatabaseQueryable } from '@contember/database'

class ProjectVariablesByIdentityQuery extends DatabaseQuery<ProjectVariablesByIdentityQuery.Result> {
	constructor(private readonly projectId: string, private readonly identityId: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<ProjectVariablesByIdentityQuery.Result> {
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

export { ProjectVariablesByIdentityQuery }
