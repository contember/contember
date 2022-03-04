import { SelectBuilder } from '@contember/database'
import { Stage } from '../../dtos'

export const prepareStageQueryBuilder = () => {
	return SelectBuilder.create<Stage>()
		.select('id')
		.select('name')
		.select('slug')
		.select('schema')
		.from('stage')
}
