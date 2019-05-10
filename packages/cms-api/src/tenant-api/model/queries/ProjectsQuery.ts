import DbQuery from '../../../core/database/DbQuery'
import DbQueryable from '../../../core/database/DbQueryable'

class ProjectsQuery extends DbQuery<ProjectsQuery.Result> {
	async fetch(queryable: DbQueryable): Promise<ProjectsQuery.Result> {
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

export default ProjectsQuery
