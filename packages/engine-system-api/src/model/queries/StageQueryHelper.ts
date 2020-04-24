import { isUuid } from '../../utils'
import { StageByIdQuery } from './StageByIdQuery'
import { StageBySlugQuery } from './StageBySlugQuery'

export const createStageQuery = (slugOrId: string) => {
	return isUuid(slugOrId) ? new StageByIdQuery(slugOrId) : new StageBySlugQuery(slugOrId)
}
