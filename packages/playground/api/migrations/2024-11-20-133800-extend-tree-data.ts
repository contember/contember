import { queryBuilder } from '../client/index.js'
import { printMutation } from './utils.js'

const data = Array.from({ length: 10 }).map((it, index) => {
	return queryBuilder.create('ExtendTreeMany', {
		data: {
			value: `value-${index}`,
		},
	})
})

export default printMutation([
	...data,
	queryBuilder.create('ExtendTreeSingle', {
		data: {
			value: 'value',
		},
	}),
])
