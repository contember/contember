import { DatabaseQuery, SelectBuilder } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'

class ProjectByIdQuery extends DatabaseQuery<ProjectByIdQuery.Result> {
	constructor(private readonly projectId: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ProjectByIdQuery.Result> {
		const rows = await SelectBuilder.create<ProjectByIdQuery.Row>()
			.select('id')
			.select('name')
			.from('project')
			.where({
				id: this.projectId,
			})
			.getResult(db)

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

export { ProjectByIdQuery }
