import 'jasmine'
import { authenticatedApiKeyId, authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { GQL, SQL } from '../../../src/tags'
import { disableApiKey } from './sql/disableApiKeySql'
import { getPersonByIdentity } from './sql/getPersonByIdentity'

describe('sign out mutation', () => {
	it('sign out', async () => {
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

	it('sign out all', async () => {
		await executeTenantTest({
			query: GQL`mutation {
          signOut(all: true) {
            ok
          }
        }`,
			executes: [
				{
					sql: SQL`select "person"."id", "person"."password_hash", "person"."identity_id", "person"."email", "identity"."roles"
from "tenant"."person" inner join "tenant"."identity" as "identity" on "identity"."id" = "person"."identity_id" where "person"."identity_id" = ?`,
					parameters: [testUuid(999)],
					response: {
						rows: [
							{
								id: testUuid(1),
								email: 'john@doe.com',
								roles: [],
							},
						],
					},
				},
				{
					sql: SQL`update "tenant"."api_key" set "disabled_at" = ? where "identity_id" = ?`,
					parameters: [(val: any) => val instanceof Date, testUuid(999)],
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

	it('sign out - not a person', async () => {
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
				{
					sql: SQL`select "person"."id", "person"."password_hash", "person"."identity_id", "person"."email", "identity"."roles"
from "tenant"."person" inner join "tenant"."identity" as "identity" on "identity"."id" = "person"."identity_id" where "person"."identity_id" = ?`,
					parameters: [testUuid(999)],
					response: {
						rows: [],
					},
				},
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
})
