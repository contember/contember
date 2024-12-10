import { queryBuilder } from '../client'
import { printMutation } from './utils'

export default printMutation([
	queryBuilder.create('GanttCategory', {
		data: {
			name: 'lorem ipsum',
		},
	}),
	queryBuilder.create('GanttCategory', {
		data: {
			name: 'dolor sit amet',
		},
	}),
	queryBuilder.create('GanttCategory', {
		data: {
			name: 'consectetur adipiscing elit',
		},
	}),
])
