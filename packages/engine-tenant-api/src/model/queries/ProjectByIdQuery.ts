import { DatabaseQuery, SelectBuilder } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'
import { Project } from '../type'

export class ProjectByIdQuery extends DatabaseQuery<Project | null> {
	constructor(private readonly projectId: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<Project | null> {
		const rows = await SelectBuilder.create<Project>()
			.select('id')
			.select('name')
			.select('slug')
			.from('project')
			.where({
				id: this.projectId,
			})
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}
