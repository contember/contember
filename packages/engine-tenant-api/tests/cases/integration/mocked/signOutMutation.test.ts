import { authenticatedApiKeyId, authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { GQL, SQL } from '../../../src/tags'
import { disableApiKey } from './sql/disableApiKeySql'
import { getPersonByIdentity } from './sql/getPersonByIdentity'
import { test } from 'vitest'
import { getApiKeySql } from './sql/getApiKeySql'
import { ApiKey } from '../../../../src'

test('sign out', async () => {
	const personId = testUuid(1)

	await executeTenantTest({
		query: GQL`mutation {
          signOut {
            ok
          }
        }`,
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: {
					personId,
					password: '123',
					roles: [],
					email: 'john@doe.com',
				},
			}),
			getApiKeySql({
				apiKeyId: authenticatedApiKeyId,
				response: { personId: personId, identityId: authenticatedIdentityId, apiKeyType: ApiKey.Type.SESSION },
			}),
			disableApiKey({ id: authenticatedApiKeyId }),
		],
		return: {
			data: {
				signOut: {
					ok: true,
				},
			},
		},
	})
})

test('sign out all', async () => {
	const identityId = authenticatedIdentityId
	const personId = testUuid(1)

	await executeTenantTest({
		query: GQL`mutation {
          signOut(all: true) {
            ok
          }
        }`,
		executes: [
			getPersonByIdentity({
				identityId,
				response: {
					password: '',
					personId: personId,
					email: 'john@doe.com',
					roles: [],
				},
			}),
			getApiKeySql({
				apiKeyId: authenticatedApiKeyId,
				response: { personId: personId, identityId: authenticatedIdentityId, apiKeyType: ApiKey.Type.SESSION },
			}),
			{
				sql: SQL`update "tenant"."api_key" set "disabled_at" = ? where "identity_id" = ?`,
				parameters: [(val: any) => val instanceof Date, identityId],
				response: { rowCount: 1 },
			},
		],
		return: {
			data: {
				signOut: {
					ok: true,
				},
			},
		},
	})
})

test('sign out - permanent api key', async () => {
	const identityId = authenticatedIdentityId
	const personId = testUuid(1)

	await executeTenantTest({
		query: GQL`mutation {
          signOut(all: true) {
            ok,
            error {
              code
            }
          }
        }`,
		executes: [
			getPersonByIdentity({
				identityId,
				response: {
					password: '',
					personId: personId,
					email: 'john@doe.com',
					roles: [],
				},
			}),
			getApiKeySql({
				apiKeyId: authenticatedApiKeyId,
				response: { personId: personId, identityId: authenticatedIdentityId, apiKeyType: ApiKey.Type.PERMANENT },
			}),
			{
				sql: SQL`update "tenant"."api_key" set "disabled_at" = ? where "identity_id" = ?`,
				parameters: [(val: any) => val instanceof Date, identityId],
				response: { rowCount: 1 },
			},
		],
		return: {
			data: {
				signOut: {
					ok: false,
					error: {
						code: 'NOT_POSSIBLE_SIGN_OUT_WITH_PERMANENT_API_KEY',
					},
				},
			},
		},
	})
})

test('sign out - not a person', async () => {
	await executeTenantTest({
		query: GQL`mutation {
          signOut(all: true) {
            ok
	          errors {
		          code
	          }
          }
        }`,
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: null,
			}),
		],
		return: {
			data: {
				signOut: {
					ok: false,
					errors: [
						{
							code: 'NOT_A_PERSON',
						},
					],
				},
			},
		},
	})
})

