import { DatabaseQuery, SelectBuilder } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'

class ProjectBySlugQuery extends DatabaseQuery<ProjectBySlugQuery.Result> {
	constructor(private readonly projectSlug: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ProjectBySlugQuery.Result> {
		const rows = await SelectBuilder.create<ProjectBySlugQuery.Row>()
			.select('id')
			.select('name')
			.select('slug')
			.from('project')
			.where({
				slug: this.projectSlug,
			})
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}

namespace ProjectBySlugQuery {
	export type Row = {
		readonly id: string
		readonly name: string
		readonly slug: string
	}
	export type Result = null | Row
}

export { ProjectBySlugQuery }
