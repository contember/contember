import { executeTenantTest } from '../../../src/testTenant.js'
import { signUpMutation } from './gql/signUp.js'
import { SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { createPersonSql } from './sql/createPersonSql.js'
import { createIdentitySql } from './sql/createIdentitySql.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { disableOneOffKeySql } from './sql/disableOneOffKeySql.js'
import { test } from 'bun:test'
import { getConfigSql } from './sql/getConfigSql.js'

test('signs up a new user', async () => {
	const email = 'john@doe.com'
	const password = 'Ab1Cd23456'
	const identityId = testUuid(1)
	const personId = testUuid(2)
	const projectId = testUuid(3)
	await executeTenantTest({
		query: signUpMutation({ email, password }),
		executes: [
			getConfigSql(),
			getPersonByEmailSql({ email, response: null }),
			...sqlTransaction(
				createIdentitySql({ identityId, roles: ['person'] }),
				createPersonSql({ personId, email, password, identityId }),
			),
			disableOneOffKeySql({ id: testUuid(998) }),
			{
				sql: SQL`select "id", "description", "roles"  from "tenant"."identity"  where "id" in (?)`,
				parameters: [testUuid(1)],
				response: { rows: [{ id: testUuid(1), description: '', roles: ['person'] }] },
			},
		],
		return: {
			data: {
				signUp: {
					ok: true,
					errors: [],
					result: {
						person: {
							id: personId,
							identity: {
								id: identityId,
								roles: ['person'],
							},
						},
					},
				},
			},
		},
	})
})

test('not sign up user with existing email — returns EMAIL_ALREADY_EXISTS with recommended action', async () => {
	const personId = testUuid(1)
	const email = 'john@doe.com'
	const password = '123456'
	await executeTenantTest({
		query: signUpMutation({ email, password }),
		executes: [
			getConfigSql(),
			getPersonByEmailSql({ email, response: { personId, password: '$2b$hash', roles: [], identityId: testUuid(1) } }),
		],
		return: {
			data: {
				signUp: {
					ok: false,
					errors: [
						{
							code: 'EMAIL_ALREADY_EXISTS',
						},
					],
					result: null,
				},
			},
		},
	})
})
