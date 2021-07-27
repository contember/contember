import { DatabaseQuery, SelectBuilder } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'
import { Project } from '../type'

export class ProjectBySlugQuery extends DatabaseQuery<(Project & { updatedAt: Date }) | null> {
	constructor(private readonly projectSlug: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<(Project & { updatedAt: Date }) | null> {
		const rows = await SelectBuilder.create<Project & { updatedAt: Date }>()
			.select('id')
			.select('name')
			.select('slug')
			.select('config')
			.select('updated_at', 'updatedAt')
			.from('project')
			.where({
				slug: this.projectSlug,
			})
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}
