import * as assert from 'uvu/assert'
import { suite } from 'uvu'
import { createAclVariables } from '../../../src'
import { Acl } from '@contember/schema'
import { testUuid } from '@contember/engine-api-tester'

const createAclVariablesTest = suite('create acl variables')

createAclVariablesTest('prefix from memberships', () => {
	assert.equal(createAclVariables({
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


createAclVariablesTest('undefined variable', () => {
	assert.equal(createAclVariables({
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


createAclVariablesTest('predefined', () => {
	assert.equal(createAclVariables({
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


createAclVariablesTest.run()
