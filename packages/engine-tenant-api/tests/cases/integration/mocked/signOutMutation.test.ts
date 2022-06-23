import { authenticatedApiKeyId, authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { GQL, SQL } from '../../../src/tags.js'
import { disableApiKey } from './sql/disableApiKeySql.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { test } from 'vitest'

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

