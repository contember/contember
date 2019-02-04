import KnexQueryable from '../../../core/knex/KnexQueryable'
import { Stage } from '../dtos/Stage'
import SelectBuilder from '../../../core/knex/SelectBuilder'
import { isUuid } from '../../../utils/uuid'
import StageByIdQuery from './StageByIdQuery'
import StageBySlugQuery from './StageBySlugQuery'

export const prepareStageQueryBuilder = (queryable: KnexQueryable): SelectBuilder<Stage> => {
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
