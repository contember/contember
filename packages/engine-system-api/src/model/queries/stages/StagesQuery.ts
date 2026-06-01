import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { prepareStageQueryBuilder } from './StageQueryFactory.js'
import { Stage } from '../../dtos/index.js'

class StagesQuery extends DatabaseQuery<Stage[]> {
	async fetch(queryable: DatabaseQueryable): Promise<Stage[]> {
		const select = prepareStageQueryBuilder()

		return await select.getResult(queryable.db)
	}
}

export { StagesQuery }
