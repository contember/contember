import { describe, it, expect } from 'bun:test'
import { createAclVariables } from '../../../src'
import { Acl } from '@contember/schema'
import { testUuid } from '../../src/testUuid'

describe('create acl variables', () => {

	const definition: Acl.EntityVariable = { type: Acl.VariableType.entity, entityName: 'Author' }
	it('prefix from memberships', () => {
		expect(createAclVariables({
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
		}, [{ role: 'author', variables: [{ name: 'authorID', condition: { in: [testUuid(2)] } }] }])).toStrictEqual({
			author__authorID: { in: [testUuid(2)] },
		})
	})


	it('undefined variable', () => {
		expect(createAclVariables({
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
		)).toStrictEqual({
			author__authorID: { never: true },
		})
	})
})
