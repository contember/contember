import DbQuery from '../../../core/knex/DbQuery'
import DbQueryable from '../../../core/knex/DbQueryable'

class ProjectByIdQuery extends DbQuery<ProjectByIdQuery.Result> {
	constructor(private readonly projectId: string) {
		super()
	}

	async fetch(queryable: DbQueryable): Promise<ProjectByIdQuery.Result> {
		const rows = await queryable
			.createSelectBuilder<ProjectByIdQuery.Row>()
			.select('id')
			.select('name')
			.from('project')
			.where({
				id: this.projectId
			})
			.getResult()

		return this.fetchOneOrNull(rows)
	}
}

namespace ProjectByIdQuery {
	export type Row = {
		readonly id: string
		readonly name: string
	}
	export type Result = null | Row
}

export default ProjectByIdQuery
