import { DatabaseQuery, SelectBuilder } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'
import { Project } from '../type'

export class ProjectBySlugQuery extends DatabaseQuery<Project | null> {
	constructor(private readonly projectSlug: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<Project | null> {
		const rows = await SelectBuilder.create<Project>()
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
