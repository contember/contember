import { printMutation } from './utils'
import { queryBuilder } from '../client'

export default printMutation([
	queryBuilder.create('BlockList', {
		data: { unique: 'unique' },
	}),
])
