import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { Project } from '../../type/index.js'

export class ProjectsQuery extends DatabaseQuery<Project[]> {
	async fetch({ db }: DatabaseQueryable): Promise<Project[]> {
		return await SelectBuilder.create<Project>()
			.select('id')
			.select('name')
			.select('slug')
			.select('config')
			.from('project')
			.orderBy('slug')
			.getResult(db)
	}
}
