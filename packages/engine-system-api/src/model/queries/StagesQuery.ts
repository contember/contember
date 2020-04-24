import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { Stage } from '../../schema'

class StagesQuery extends DatabaseQuery<Stage[]> {
	async fetch(queryable: DatabaseQueryable): Promise<Stage[]> {
		const select = SelectBuilder.create<Stage>()
			.from('stage')
			.select('id')
			.select('name')
			.select('slug')

		return await select.getResult(queryable.db)
	}
}

export { StagesQuery }
