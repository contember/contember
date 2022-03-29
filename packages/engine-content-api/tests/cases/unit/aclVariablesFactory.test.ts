import { describe, it, assert } from 'vitest'
import { createAclVariables } from '../../../src'
import { Acl } from '@contember/schema'
import { testUuid } from '@contember/engine-api-tester'

describe('create acl variables', () => {

	it('prefix from memberships', () => {
		assert.deepStrictEqual(createAclVariables({
			roles: {
				author: {
					stages: '*',
					variables: {
						authorID: { type: Acl.VariableType.entity, entityName: 'Author' },
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
			author__authorID: [testUuid(2)],
		})
	})


	it('undefined variable', () => {
		assert.deepStrictEqual(createAclVariables({
			roles: {
				author: {
					stages: '*',
					variables: {
						authorID: { type: Acl.VariableType.entity, entityName: 'Author' },
					},
					entities: {},
				},
			},
		}, {
			identityId: testUuid(1),
			personId: null,
			memberships: [{ role: 'author', variables: [] }],
		}), {
			author__authorID: [],
		})
	})


	it('predefined', () => {
		assert.deepStrictEqual(createAclVariables({
			roles: {
				author: {
					stages: '*',
					variables: {
						authorIdentity: { type: Acl.VariableType.predefined, value: 'identityID' },
					},
					entities: {},
				},
			},
		}, {
			identityId: testUuid(1),
			personId: null,
			memberships: [{ role: 'author', variables: [] }],
		}), {
			author__authorIdentity: [testUuid(1)],
		})
	})
})
