import { DatabaseQuery, SelectBuilder } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'
import { Project } from '../../type'

export class ProjectBySlugQuery extends DatabaseQuery<(Project & { updatedAt: Date }) | null> {
	constructor(private readonly projectSlug: string, private readonly alias = false) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<(Project & { updatedAt: Date }) | null> {
		const baseQb = SelectBuilder.create<Project & { updatedAt: Date }>()
			.select('id')
			.select('name')
			.select('slug')
			.select('config')
			.select('updated_at', 'updatedAt')
			.from('project')
		const rows = await baseQb
			.where({
				slug: this.projectSlug,
			})
			.getResult(db)
		const row = this.fetchOneOrNull(rows)
		if (!this.alias || row) {
			return row
		}
		const rows2 = await baseQb //
			.where(expr => expr.raw('config->? \\? ?', 'alias', this.projectSlug))
			.getResult(db)
		return this.fetchOneOrNull(rows2)
	}
}
