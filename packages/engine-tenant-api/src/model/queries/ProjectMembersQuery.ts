import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

class ProjectMembersQuery extends DatabaseQuery<ProjectMembersQuery.Result> {
	constructor(private readonly projectId: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ProjectMembersQuery.Result> {
		return await SelectBuilder.create<{ id: string }>()
			.select(expr => expr.raw('distinct (identity_id)'), 'id')
			.from('project_membership')
			.where({
				project_id: this.projectId,
			})
			.getResult(db)
	}
}

namespace ProjectMembersQuery {
	export type Result = { id: string }[]
}

export { ProjectMembersQuery }
