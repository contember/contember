import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

export class ProjectUpdateTimestampQuery extends DatabaseQuery<Date | null> {
	constructor(private readonly projectSlug: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<Date | null> {
		const rows = await SelectBuilder.create<{ updated_at: Date }>()
			.select('updated_at')
			.from('project')
			.where({
				slug: this.projectSlug,
			})
			.getResult(db)

		return this.fetchOneOrNull(rows)?.updated_at ?? null
	}
}
