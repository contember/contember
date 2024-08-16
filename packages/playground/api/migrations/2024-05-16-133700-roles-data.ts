import { printMutation } from './utils'
import { queryBuilder } from '../client'

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
