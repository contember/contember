import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

class ProjectsQuery extends DatabaseQuery<ProjectsQuery.Result> {
	async fetch({ db }: DatabaseQueryable): Promise<ProjectsQuery.Result> {
		return await SelectBuilder.create<ProjectsQuery.Row>()
			.select('id')
			.select('name')
			.select('slug')
			.from('project')
			.getResult(db)
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
