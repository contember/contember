import { DatabaseQuery, DatabaseQueryable } from '@contember/database'

class ProjectMembersQuery extends DatabaseQuery<ProjectMembersQuery.Result> {
	constructor(private readonly projectId: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<ProjectMembersQuery.Result> {
		return await queryable
			.createSelectBuilder<{ id: string }>()
			.select(expr => expr.raw('distinct (identity_id)'), 'id')
			.from('project_membership')
			.where({
				project_id: this.projectId,
			})
			.getResult()
	}
}

namespace ProjectMembersQuery {
	export type Result = { id: string }[]
}

export { ProjectMembersQuery }
