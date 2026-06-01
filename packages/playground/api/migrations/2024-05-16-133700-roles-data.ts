import { printMutation } from './utils.js'
import { queryBuilder } from '../client/index.js'

export default printMutation([
	queryBuilder.create('AclBranch', {
		data: { code: 'cs' },
	}),
	queryBuilder.create('AclBranch', {
		data: { code: 'sk' },
	}),
	queryBuilder.create('AclBranch', {
		data: { code: 'de' },
	}),
	queryBuilder.create('AclBranch', {
		data: { code: 'pl' },
	}),
])
