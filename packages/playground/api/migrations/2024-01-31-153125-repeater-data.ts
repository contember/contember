import { printMutation } from './utils.js'
import { queryBuilder } from '../client/index.js'

export default printMutation([
	queryBuilder.create('RepeaterItem', {
		data: {
			title: 'Hello world item #1',
			order: 1,
		},
	}),
	queryBuilder.create('RepeaterItem', {
		data: {
			title: 'Hello world item #2',
			order: 2,
		},
	}),
	queryBuilder.create('RepeaterItem', {
		data: {
			title: 'Hello world item #3',
			order: 3,
		},
	}),
	queryBuilder.create('RepeaterItem', {
		data: {
			title: 'Hello world item #4',
			order: 4,
		},
	}),
])
