import { printMutation } from './utils.js'
import { queryBuilder } from '../client/index.js'

export default printMutation([
	queryBuilder.create('BlockList', {
		data: { unique: 'unique' },
	}),
])
