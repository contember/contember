import { DatabaseQuery, DatabaseQueryable } from '@contember/database'

class ProjectsQuery extends DatabaseQuery<ProjectsQuery.Result> {
	async fetch(queryable: DatabaseQueryable): Promise<ProjectsQuery.Result> {
		return await queryable
			.createSelectBuilder<ProjectsQuery.Row>()
			.select('id')
			.select('name')
			.select('slug')
			.from('project')
			.getResult()
	}
}

namespace ProjectsQuery {
	export type Row = {
		readonly id: string
		readonly name: string
		readonly slug: string
	}
	export type Result = Array<Row>
}

export { ProjectsQuery }
