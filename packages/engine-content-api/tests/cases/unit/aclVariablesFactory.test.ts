import { describe, it, assert } from 'vitest'
import { createAclVariables } from '../../../src/index.js'
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
		}, {
			identityId: testUuid(1),
			personId: null,
			memberships: [{ role: 'author', variables: [{ name: 'authorID', values: [testUuid(2)] }] }],
		}), {
			author__authorID: { definition, value: [testUuid(2)] },
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
		}, {
			identityId: testUuid(1),
			personId: null,
			memberships: [{ role: 'author', variables: [] }],
		}), {
			author__authorID: { definition, value: [] },
		})
	})


	it('predefined', () => {
		const definition: Acl.PredefinedVariable = { type: Acl.VariableType.predefined, value: 'identityID' }
		assert.deepStrictEqual(createAclVariables({
			roles: {
				author: {
					stages: '*',
					variables: {
						authorIdentity: definition,
					},
					entities: {},
				},
			},
		}, {
			identityId: testUuid(1),
			personId: null,
			memberships: [{ role: 'author', variables: [] }],
		}), {
			author__authorIdentity: { definition, value: [testUuid(1)] },
		})
	})
})
