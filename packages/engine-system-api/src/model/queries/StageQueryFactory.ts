import { DatabaseQueryable } from '@contember/database'
import { StageWithId } from '../dtos/Stage'

export const prepareStageQueryBuilder = (queryable: DatabaseQueryable) => {
	return queryable
		.createSelectBuilder<StageWithId>()
		.select('id')
		.select('name')
		.select('slug')
		.select('event_id')
		.from('stage')
}
