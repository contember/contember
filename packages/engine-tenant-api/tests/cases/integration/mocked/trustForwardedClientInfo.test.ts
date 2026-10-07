import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { signInMutation } from './gql/signIn.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { localAuthDisablingIdpsSql } from './sql/localAuthDisablingIdpsSql.js'
import { expect, test } from 'bun:test'
import { createSessionKeySql } from './sql/createSessionKeySql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { getNextLoginAttemptSql } from './sql/getNextLoginAttemptSql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getAuthPoliciesSql } from './sql/authPolicySql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'
import { GQL, SQL } from '../../../src/tags.js'
import { sqlReadCommittedTransaction } from './sql/sqlTransaction.js'
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
			localAuthDisablingIdpsSql({ personId }),
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
			localAuthDisablingIdpsSql({ personId }),
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
			// read committed: the global-role validator takes a FOR SHARE lock on custom_role
			...sqlReadCommittedTransaction(
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

// Through the real authorization stack: project_admin may not mint a trusted-forwarding key, so a
// custom role (bounded by its surface) may not either — even from a row persisted with the flag on.
const integrationManagerPreloadSql = (allowTrustForwardedClientInfo: boolean) => ({
	sql: SQL`select *  from "tenant"."custom_role"  order by "slug" asc`,
	parameters: [],
	response: {
		rows: [{
			id: testUuid(50),
			slug: 'integration_manager',
			description: null,
			grants: [{ permission: 'apiKey:createGlobal', config: { roles: { allowed: [] }, allowTrustForwardedClientInfo } }],
			created_at: new Date(),
			updated_at: new Date(),
		}],
	},
})

const createGlobalApiKeyMutation = GQL`mutation($options: CreateApiKeyOptions) {
	createGlobalApiKey(description: "backend service", roles: [], options: $options) { ok }
}`

test('createGlobalApiKey: a custom role may create a key that does not trust forwarded client info', async () => {
	const identityId = testUuid(1)
	await executeTenantTest({
		identityRoles: ['integration_manager'],
		query: { query: createGlobalApiKeyMutation, variables: { options: { trustForwardedClientInfo: false } } },
		executes: [
			integrationManagerPreloadSql(false),
			...sqlReadCommittedTransaction(
				createIdentitySql({ identityId, description: 'backend service' }),
				createApiKeySql({ identityId, apiKeyId: testUuid(2) }),
			),
		],
		return: { data: { createGlobalApiKey: { ok: true } } },
		expectedAuthLog: expect.objectContaining({ type: 'api_key_create' }),
	})
})

test.each([false, true])(
	'createGlobalApiKey: a custom role (persisted allowTrustForwardedClientInfo=%p) may not create a key trusting forwarded client info',
	async allowTrustForwardedClientInfo => {
		await executeTenantTest({
			identityRoles: ['integration_manager'],
			query: { query: createGlobalApiKeyMutation, variables: { options: { trustForwardedClientInfo: true } } },
			executes: [integrationManagerPreloadSql(allowTrustForwardedClientInfo)],
			return: {
				data: { createGlobalApiKey: null },
				errors: [{ message: 'You are not allowed to create a global API key' }],
			},
		})
	},
)
