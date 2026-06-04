import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { signInMutation } from './gql/signIn.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { expect, test } from 'bun:test'
import { createSessionKeySql } from './sql/createSessionKeySql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { getNextLoginAttemptSql } from './sql/getNextLoginAttemptSql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getAuthPoliciesSql } from './sql/authPolicySql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'
import { GQL } from '../../../src/tags.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { createIdentitySql } from './sql/createIdentitySql.js'
import { createApiKeySql } from './sql/createApiKeySql.js'

test('signIn: trustForwardedClientInfo=true is propagated when caller has the flag', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		callerTrustForwardedInfo: true,
		query: signInMutation({ email, password, options: { trustForwardedClientInfo: true } }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			getAuthPoliciesSql(),
			getConfigSql(),
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId, trustForwardedInfo: true }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: [{ role: 'editor', variables: [] }],
			}),
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
		expectedAuthLog: { type: 'login', response: expect.objectContaining({ ok: true }) },
	})
})

test('signIn: trustForwardedClientInfo=true is silently dropped when caller has no flag', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		callerTrustForwardedInfo: false,
		query: signInMutation({ email, password, options: { trustForwardedClientInfo: true } }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			getAuthPoliciesSql(),
			getConfigSql(),
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId, trustForwardedInfo: false }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: [{ role: 'editor', variables: [] }],
			}),
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
		expectedAuthLog: { type: 'login', response: expect.objectContaining({ ok: true }) },
	})
})

test('createGlobalApiKey: trustForwardedClientInfo=true creates permanent key with flag (no propagation needed)', async () => {
	const identityId = testUuid(1)
	const apiKeyId = testUuid(2)
	await executeTenantTest({
		callerTrustForwardedInfo: false,
		query: {
			query: GQL`mutation($description: String!, $roles: [String!], $options: CreateApiKeyOptions) {
				createGlobalApiKey(description: $description, roles: $roles, options: $options) {
					ok
					errors { code }
					result { apiKey { identity { id } } }
				}
			}`,
			variables: { description: 'backend service', roles: [], options: { trustForwardedClientInfo: true } },
		},
		executes: [
			...sqlTransaction(
				createIdentitySql({ identityId, description: 'backend service' }),
				createApiKeySql({ identityId, apiKeyId, trustForwardedInfo: true }),
			),
		],
		return: {
			data: {
				createGlobalApiKey: {
					ok: true,
					errors: [],
					result: { apiKey: { identity: { id: identityId } } },
				},
			},
		},
		expectedAuthLog: expect.objectContaining({ type: 'api_key_create' }),
	})
})
