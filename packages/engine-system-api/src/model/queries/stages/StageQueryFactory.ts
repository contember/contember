import { SelectBuilder } from '@contember/database'
import { StageWithId } from '../../dtos'

export const prepareStageQueryBuilder = () => {
	return SelectBuilder.create<StageWithId>() //
		.select('id')
		.select('name')
		.select('slug')
		.select('event_id')
		.from('stage')
}
