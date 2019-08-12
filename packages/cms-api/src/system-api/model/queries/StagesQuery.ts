import { DatabaseQuery } from '@contember/database'
import { Stage } from '../../schema/types'
import { DatabaseQueryable } from '@contember/database'

class StagesQuery extends DatabaseQuery<Stage[]> {
	async fetch(queryable: DatabaseQueryable): Promise<Stage[]> {
		const select = queryable
			.createSelectBuilder<Stage>()
			.from('stage')
			.select('id')
			.select('name')
			.select('slug')

		return await select.getResult()
	}
}

export default StagesQuery
