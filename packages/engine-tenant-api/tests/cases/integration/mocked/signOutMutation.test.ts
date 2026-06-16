import { authenticatedApiKeyId, authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { GQL, SQL } from '../../../src/tags.js'
import { disableApiKey } from './sql/disableApiKeySql.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { expect, test } from 'bun:test'
import { getApiKeySql } from './sql/getApiKeySql.js'
import { getIdpSessionByApiKeySql } from './sql/getIdpSessionByApiKeySql.js'
import { ApiKey } from '../../../../src/index.js'
import { Buffer } from 'buffer'

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
			getIdpSessionByApiKeySql({ apiKeyId: authenticatedApiKeyId, response: null }),
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
			getIdpSessionByApiKeySql({ apiKeyId: authenticatedApiKeyId, response: null }),
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

test('sign out - OIDC RP-initiated logout returns logoutUrl', async () => {
	const personId = testUuid(1)
	const identityProviderId = testUuid(2)

	await executeTenantTest({
		// a `decrypt` that returns the stored id_token, so the manager can build the logout URL
		providers: {
			decrypt: async () => ({ value: Buffer.from(JSON.stringify({ id_token: 'ID-TOKEN-123' }), 'utf8'), needsReEncrypt: false }),
		},
		query: GQL`mutation {
          signOut {
            ok
            logoutUrl
          }
        }`,
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, password: '123', roles: [], email: 'john@doe.com' },
			}),
			getApiKeySql({
				apiKeyId: authenticatedApiKeyId,
				response: { personId, identityId: authenticatedIdentityId, apiKeyType: ApiKey.Type.SESSION },
			}),
			getIdpSessionByApiKeySql({
				apiKeyId: authenticatedApiKeyId,
				response: {
					id: testUuid(3),
					identityProviderId,
					providerType: 'mock',
					providerConfiguration: { endSessionEndpoint: 'https://idp.example.com/logout', postLogoutRedirectUri: 'https://app.example.com/' },
					tokens: Buffer.from('encrypted'),
					tokensVersion: 0,
				},
			}),
			disableApiKey({ id: authenticatedApiKeyId }),
		],
		return: {
			data: {
				signOut: {
					ok: true,
					logoutUrl: 'https://idp.example.com/logout?id_token_hint=ID-TOKEN-123&post_logout_redirect_uri=https%3A%2F%2Fapp.example.com%2F',
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'idp_logout_initiated',
			identityProviderId,
			eventData: { all: false },
		}),
	})
})

test('sign out all - OIDC RP-initiated logout returns logoutUrl and audits all:true', async () => {
	const personId = testUuid(1)
	const identityProviderId = testUuid(2)

	await executeTenantTest({
		// a `decrypt` that returns the stored id_token, so the manager can build the logout URL
		providers: {
			decrypt: async () => ({ value: Buffer.from(JSON.stringify({ id_token: 'ID-TOKEN-123' }), 'utf8'), needsReEncrypt: false }),
		},
		query: GQL`mutation {
          signOut(all: true) {
            ok
            logoutUrl
          }
        }`,
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, password: '123', roles: [], email: 'john@doe.com' },
			}),
			getApiKeySql({
				apiKeyId: authenticatedApiKeyId,
				response: { personId, identityId: authenticatedIdentityId, apiKeyType: ApiKey.Type.SESSION },
			}),
			getIdpSessionByApiKeySql({
				apiKeyId: authenticatedApiKeyId,
				response: {
					id: testUuid(3),
					identityProviderId,
					providerType: 'mock',
					providerConfiguration: { endSessionEndpoint: 'https://idp.example.com/logout', postLogoutRedirectUri: 'https://app.example.com/' },
					tokens: Buffer.from('encrypted'),
					tokensVersion: 0,
				},
			}),
			{
				sql: SQL`update "tenant"."api_key" set "disabled_at" = ? where "identity_id" = ?`,
				parameters: [(val: any) => val instanceof Date, authenticatedIdentityId],
				response: { rowCount: 1 },
			},
		],
		return: {
			data: {
				signOut: {
					ok: true,
					logoutUrl: 'https://idp.example.com/logout?id_token_hint=ID-TOKEN-123&post_logout_redirect_uri=https%3A%2F%2Fapp.example.com%2F',
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'idp_logout_initiated',
			identityProviderId,
			eventData: { all: true },
		}),
	})
})

test('sign out - federated IdP without end_session_endpoint falls back to local logout (no logoutUrl)', async () => {
	const personId = testUuid(1)
	const identityProviderId = testUuid(2)

	await executeTenantTest({
		providers: {
			decrypt: async () => ({ value: Buffer.from(JSON.stringify({ id_token: 'ID-TOKEN-123' }), 'utf8'), needsReEncrypt: false }),
		},
		query: GQL`mutation {
          signOut {
            ok
            logoutUrl
          }
        }`,
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, password: '123', roles: [], email: 'john@doe.com' },
			}),
			getApiKeySql({
				apiKeyId: authenticatedApiKeyId,
				response: { personId, identityId: authenticatedIdentityId, apiKeyType: ApiKey.Type.SESSION },
			}),
			getIdpSessionByApiKeySql({
				apiKeyId: authenticatedApiKeyId,
				response: {
					id: testUuid(3),
					identityProviderId,
					providerType: 'mock',
					// no endSessionEndpoint → buildLogoutUrl returns null → graceful fallback
					providerConfiguration: {},
					tokens: Buffer.from('encrypted'),
					tokensVersion: 0,
				},
			}),
			disableApiKey({ id: authenticatedApiKeyId }),
		],
		return: {
			data: {
				signOut: {
					ok: true,
					logoutUrl: null,
				},
			},
		},
	})
})
