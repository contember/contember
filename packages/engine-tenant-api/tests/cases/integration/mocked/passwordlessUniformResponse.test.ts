import { expect, test } from 'bun:test'
import { executeTenantTest } from '../../../src/testTenant.js'
import { GQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { localAuthDisablingIdpsSql } from './sql/localAuthDisablingIdpsSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'

const email = 'john@doe.com'
const personId = testUuid(7)
const identityId = testUuid(2)

const initMutation = {
	query: GQL`mutation($email: String!) {
		initSignInPasswordless(email: $email) {
			ok
			error { code }
			result { requestId expiresAt }
		}
	}`,
	variables: { email },
}

const config = (uniformResponse: boolean, enabled = 'always') =>
	getConfigSql({ passwordless_enabled: enabled, passwordless_uniform_response: uniformResponse })

const initLog = expect.objectContaining({ type: 'passwordless_login_init', response: expect.objectContaining({ ok: false }) })

test('with uniformResponse, an unknown address gets a request id and no mail', async () => {
	await executeTenantTest({
		query: initMutation,
		executes: [
			config(true),
			...sqlTransaction(config(true), getPersonByEmailSql({ email, response: null })),
		],
		return: {
			data: {
				initSignInPasswordless: {
					ok: true,
					error: null,
					result: { requestId: testUuid(1), expiresAt: '2019-09-04T12:10:00.000Z' },
				},
			},
		},
		expectedAuthLog: initLog,
	})
})

test('with uniformResponse, a person bound to an identity provider gets a request id and no mail', async () => {
	await executeTenantTest({
		query: initMutation,
		executes: [
			config(true),
			...sqlTransaction(
				config(true),
				getPersonByEmailSql({ email, response: { personId, identityId, password: '123', roles: [] } }),
				localAuthDisablingIdpsSql({ personId, slugs: ['corporateSso'] }),
			),
		],
		return: (response: { data: { initSignInPasswordless: { ok: boolean; error: null; result: { requestId: string } } } }) => {
			expect(response.data.initSignInPasswordless.ok).toBe(true)
			expect(response.data.initSignInPasswordless.result.requestId).toBe(testUuid(1))
		},
		expectedAuthLog: initLog,
	})
})

test('without uniformResponse, an unknown address is reported', async () => {
	await executeTenantTest({
		query: initMutation,
		executes: [
			config(false),
			...sqlTransaction(config(false), getPersonByEmailSql({ email, response: null })),
		],
		return: { data: { initSignInPasswordless: { ok: false, error: { code: 'PERSON_NOT_FOUND' }, result: null } } },
		expectedAuthLog: initLog,
	})
})

test('with passwordless globally off, the refusal stays an error', async () => {
	await executeTenantTest({
		query: initMutation,
		executes: [config(true, 'never'), ...sqlTransaction(config(true, 'never'))],
		return: { data: { initSignInPasswordless: { ok: false, error: { code: 'PASSWORDLESS_DISABLED' }, result: null } } },
		expectedAuthLog: initLog,
	})
})

test('an address with whitespace inside is not looked up and gets no mail', async () => {
	await executeTenantTest({
		query: { ...initMutation, variables: { email: 'big john@doe.com' } },
		executes: [config(false)],
		return: { data: { initSignInPasswordless: { ok: false, error: { code: 'PERSON_NOT_FOUND' }, result: null } } },
		expectedAuthLog: initLog,
	})
})

test('with passwordless globally off, an address with whitespace inside gets the same refusal', async () => {
	await executeTenantTest({
		query: { ...initMutation, variables: { email: 'big john@doe.com' } },
		executes: [config(false, 'never')],
		return: { data: { initSignInPasswordless: { ok: false, error: { code: 'PASSWORDLESS_DISABLED' }, result: null } } },
		expectedAuthLog: initLog,
	})
})
