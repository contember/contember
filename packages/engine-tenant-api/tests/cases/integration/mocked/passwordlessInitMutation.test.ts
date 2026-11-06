import { expect, test } from 'bun:test'
import { executeTenantTest } from '../../../src/testTenant'
import { GQL } from '../../../src/tags'
import { getConfigSql } from './sql/getConfigSql'
import { sqlTransaction } from './sql/sqlTransaction'

const initMutation = (email: string) => ({
	query: GQL`mutation($email: String!) {
		initSignInPasswordless(email: $email) {
			ok
			error { code }
		}
	}`,
	variables: { email },
})

const initLog = expect.objectContaining({ type: 'passwordless_login_init', response: expect.objectContaining({ ok: false }) })

test('an address with whitespace inside is not looked up and gets no mail', async () => {
	await executeTenantTest({
		query: initMutation('big john@doe.com'),
		executes: [...sqlTransaction(getConfigSql({ passwordless_enabled: 'always' })), getConfigSql({ passwordless_enabled: 'always' })],
		return: { data: { initSignInPasswordless: { ok: false, error: { code: 'PERSON_NOT_FOUND' } } } },
		expectedAuthLog: initLog,
	})
})

test('with passwordless globally off, an address with whitespace inside gets the same refusal', async () => {
	await executeTenantTest({
		query: initMutation('big john@doe.com'),
		executes: [...sqlTransaction(getConfigSql())],
		return: { data: { initSignInPasswordless: { ok: false, error: { code: 'PASSWORDLESS_DISABLED' } } } },
		expectedAuthLog: initLog,
	})
})
