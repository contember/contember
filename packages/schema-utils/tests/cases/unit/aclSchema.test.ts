import { expect, test } from 'bun:test'
import { Acl } from '@contember/schema'
import { aclSchema } from '../../../src/type-schema/index.js'

test('acl schema keeps the fallback of a predefined variable', () => {
	const acl: Acl.Schema = {
		roles: {
			customer: {
				variables: {
					person: { type: Acl.VariableType.predefined, value: 'personID', fallback: { never: true } },
				},
				entities: {},
			},
		},
	}
	expect(aclSchema(acl)).toStrictEqual(acl)
})
