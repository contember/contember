import { describe, it, assert } from 'vitest'
import { createAclVariables } from '../../../src'
import { Acl } from '@contember/schema'
import { testUuid } from '@contember/engine-api-tester'

describe('create acl variables', () => {

	const definition: Acl.EntityVariable = { type: Acl.VariableType.entity, entityName: 'Author' }
	it('prefix from memberships', () => {
		assert.deepStrictEqual(createAclVariables({
			roles: {
				author: {
					stages: '*',
					variables: {
						authorID: definition,
					},
					entities: {
					},
				},
			},
		}, [{ role: 'author', variables: [{ name: 'authorID', condition: { in: [testUuid(2)] } }] }]), {
			author__authorID: { in: [testUuid(2)] },
		})
	})


	it('undefined variable', () => {
		assert.deepStrictEqual(createAclVariables({
			roles: {
				author: {
					stages: '*',
					variables: {
						authorID: definition,
					},
					entities: {},
				},
			},
		}, [{ role: 'author', variables: [] }],
		), {
			author__authorID: { never: true },
		})
	})
})
