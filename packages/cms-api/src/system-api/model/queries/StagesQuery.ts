import KnexQuery from '../../../core/knex/KnexQuery'
import { Stage } from '../../schema/types'
import KnexQueryable from '../../../core/knex/KnexQueryable'

class StagesQuery extends KnexQuery<Stage[]> {
	async fetch(queryable: KnexQueryable): Promise<Stage[]> {
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
