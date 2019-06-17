import DbQueryable from '../../../core/database/DbQueryable'
import { Stage } from '../dtos/Stage'
import SelectBuilder from '../../../core/database/SelectBuilder'
import { isUuid } from '../../../utils/uuid'
import StageByIdQuery from './StageByIdQuery'
import StageBySlugQuery from './StageBySlugQuery'

export const prepareStageQueryBuilder = (queryable: DbQueryable) => {
	return queryable
		.createSelectBuilder<Stage>()
		.select('id')
		.select('name')
		.select('slug')
		.select('event_id')
		.from('stage')
}

export const createStageQuery = (slugOrId: string) => {
	return isUuid(slugOrId) ? new StageByIdQuery(slugOrId) : new StageBySlugQuery(slugOrId)
}
