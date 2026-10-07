import { executeTenantTest } from '../../../src/testTenant.js'
import { signUpMutation } from './gql/signUp.js'
import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { createPersonSql } from './sql/createPersonSql.js'
import { createIdentitySql } from './sql/createIdentitySql.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { sqlReadCommittedTransaction } from './sql/sqlTransaction.js'
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
			...sqlReadCommittedTransaction(
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

const signUpWithRolesMutation = (variables: { email: string; password: string; roles: string[] }) => ({
	query: GQL`mutation($email: String!, $password: String!, $roles: [String!]) {
		signUp(email: $email, password: $password, roles: $roles) {
			ok
			errors { code }
		}
	}`,
	variables,
})

const customRoleForShareSql = (slug: string, exists: boolean) => ({
	sql: SQL`select *  from "tenant"."custom_role" where "slug" in (?)  order by "slug" asc for share`,
	parameters: [slug],
	response: {
		rows: exists ? [{ id: testUuid(50), slug, description: null, grants: [], created_at: new Date(), updated_at: new Date() }] : [],
	},
})

// The FOR SHARE lock must be held until the identity is written, or a concurrent
// deleteCustomRole can commit in between and leave the new identity a dangling slug.
test('signs up a new user with a custom role, validating it inside the creating transaction', async () => {
	const email = 'john@doe.com'
	const password = 'Ab1Cd23456'
	const identityId = testUuid(1)
	const personId = testUuid(2)
	await executeTenantTest({
		query: signUpWithRolesMutation({ email, password, roles: ['support'] }),
		executes: [
			getConfigSql(),
			getPersonByEmailSql({ email, response: null }),
			...sqlReadCommittedTransaction(
				customRoleForShareSql('support', true),
				createIdentitySql({ identityId, roles: ['support', 'person'] }),
				createPersonSql({ personId, email, password, identityId }),
			),
			disableOneOffKeySql({ id: testUuid(998) }),
		],
		return: {
			data: { signUp: { ok: true, errors: [] } },
		},
	})
})

test('refuses sign-up with an unknown custom role inside the transaction', async () => {
	const email = 'john@doe.com'
	const password = 'Ab1Cd23456'
	await executeTenantTest({
		query: signUpWithRolesMutation({ email, password, roles: ['ghost'] }),
		executes: [
			getConfigSql(),
			getPersonByEmailSql({ email, response: null }),
			...sqlReadCommittedTransaction(customRoleForShareSql('ghost', false)),
		],
		return: {
			data: { signUp: { ok: false, errors: [{ code: 'INVALID_ROLE' }] } },
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
