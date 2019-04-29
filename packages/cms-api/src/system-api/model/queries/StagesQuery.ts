import DbQuery from '../../../core/database/DbQuery'
import { Stage } from '../../schema/types'
import DbQueryable from '../../../core/database/DbQueryable'

class StagesQuery extends DbQuery<Stage[]> {
	async fetch(queryable: DbQueryable): Promise<Stage[]> {
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
