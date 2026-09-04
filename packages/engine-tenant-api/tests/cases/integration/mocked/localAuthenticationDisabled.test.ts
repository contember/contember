import { expect, test } from 'bun:test'
import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { signInMutation } from './gql/signIn.js'
import { initSignInPasswordlessMutation } from './gql/passwordless.js'
import { createResetPasswordRequestMutation } from './gql/createResetPasswordRequest.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getNextLoginAttemptSql } from './sql/getNextLoginAttemptSql.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { localAuthDisablingIdpsSql } from './sql/localAuthDisablingIdpsSql.js'
import { createSessionKeySql } from './sql/createSessionKeySql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'
import { getAuthPoliciesSql } from './sql/authPolicySql.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'

const email = 'john@doe.com'
const password = '123'
const personId = testUuid(7)
const identityId = testUuid(2)

test('signIn - a provider that disables local authentication refuses the password', async () => {
	await executeTenantTest({
		query: signInMutation({ email, password }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			localAuthDisablingIdpsSql({ personId, slugs: ['corporateSso'] }),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: 'IDP_REQUIRED' }],
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: false }),
		},
	})
})

test('signIn - the wrong password is not even consulted, so the answer cannot double as a password oracle', async () => {
	await executeTenantTest({
		query: signInMutation({ email, password: 'not-the-password' }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			localAuthDisablingIdpsSql({ personId, slugs: ['corporateSso'] }),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: 'IDP_REQUIRED' }],
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: false }),
		},
	})
})

test('signIn - revealLoginMethod off collapses it into INVALID_CREDENTIALS', async () => {
	await executeTenantTest({
		query: signInMutation({ email, password }),
		executes: [
			getConfigSql({ login_reveal_login_method: false }),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			localAuthDisablingIdpsSql({ personId, slugs: ['corporateSso'] }),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: 'INVALID_CREDENTIALS' }],
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: false }),
		},
	})
})

test('signIn - a person with no such link signs in as before', async () => {
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		query: signInMutation({ email, password }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			// The asserted SQL carries `disabled_at IS NULL`, so a DISABLED provider never
			// reaches this list — turning the provider off is the break-glass.
			localAuthDisablingIdpsSql({ personId }),
			getAuthPoliciesSql(),
			getConfigSql(),
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: {
				signIn: {
					ok: true,
					errors: [],
					result: { token: '0000000000000000000000000000000000000000' },
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: true }),
		},
	})
})

test('initSignInPasswordless - the magic link is refused as well, so no second door stays open', async () => {
	await executeTenantTest({
		query: initSignInPasswordlessMutation({ email }),
		executes: [
			getConfigSql({ passwordless_enabled: 'always' }),
			...sqlTransaction(
				getConfigSql({ passwordless_enabled: 'always' }),
				getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
				localAuthDisablingIdpsSql({ personId, slugs: ['corporateSso'] }),
			),
		],
		return: {
			data: {
				initSignInPasswordless: {
					ok: false,
					error: { code: 'IDP_REQUIRED' },
				},
			},
		},
		expectedAuthLog: {
			type: 'passwordless_login_init',
			response: expect.objectContaining({ ok: false }),
		},
	})
})

test('createResetPasswordRequest - reports ok but sends nothing, because the password it would set is unusable', async () => {
	await executeTenantTest({
		query: createResetPasswordRequestMutation({ email }),
		executes: [
			getConfigSql(),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			localAuthDisablingIdpsSql({ personId, slugs: ['corporateSso'] }),
		],
		return: {
			data: {
				createResetPasswordRequest: {
					ok: true,
				},
			},
		},
		expectedAuthLog: {
			type: 'password_reset_init',
			personInput: email,
			personId,
			response: expect.objectContaining({ ok: true }),
		},
	})
})
