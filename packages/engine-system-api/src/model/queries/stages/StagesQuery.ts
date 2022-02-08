import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { prepareStageQueryBuilder } from './StageQueryFactory'
import { Stage } from '../../dtos'

class StagesQuery extends DatabaseQuery<Stage[]> {
	async fetch(queryable: DatabaseQueryable): Promise<Stage[]> {
		const select = prepareStageQueryBuilder()

		return await select.getResult(queryable.db)
	}
}

export { StagesQuery }
