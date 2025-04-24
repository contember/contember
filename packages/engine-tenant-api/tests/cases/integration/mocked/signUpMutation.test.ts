import { executeTenantTest } from '../../../src/testTenant'
import { signUpMutation } from './gql/signUp'
import { SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { createPersonSql } from './sql/createPersonSql'
import { createIdentitySql } from './sql/createIdentitySql'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql'
import { sqlTransaction } from './sql/sqlTransaction'
import { disableOneOffKeySql } from './sql/disableOneOffKeySql'
import { test } from 'bun:test'
import { getConfigSql } from './sql/getConfigSql'

test('signs up a new user', async () => {
	const email = 'john@doe.com'
	const password = 'Ab1Cd23456'
	const identityId = testUuid(1)
	const personId = testUuid(2)
	const projectId = testUuid(3)
	await executeTenantTest({
		query: signUpMutation({ email, password }),
		executes: [
			getPersonByEmailSql({ email, response: null }),
			getConfigSql(),
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

test('not sign up user with existing email', async () => {
	const personId = testUuid(1)
	const email = 'john@doe.com'
	const password = '123456'
	await executeTenantTest({
		query: signUpMutation({ email, password }),
		executes: [
			getPersonByEmailSql({ email, response: { personId, password: '', roles: [], identityId: testUuid(1) } }),
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

