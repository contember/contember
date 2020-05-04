import 'jasmine'
import { executeTenantTest } from '../../../src/testTenant'
import { SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { selectMembershipsSql } from './sql/selectMembershipsSql'
import { signInMutation } from './gql/signIn'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql'

describe('sign in mutation', () => {
	it('signs in', async () => {
		const email = 'john@doe.com'
		const password = '123'
		const identityId = testUuid(2)
		const personId = testUuid(7)
		const projectId = testUuid(10)
		const apiKeyId = testUuid(1)
		await executeTenantTest({
			query: signInMutation({ email, password }),
			executes: [
				getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
				{
					sql: SQL`INSERT INTO "tenant"."api_key" ("id", "token_hash", "type", "identity_id", "disabled_at", "expires_at", "expiration", "created_at")
					         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
					parameters: [
						apiKeyId,
						'9692e67b8378a6f6753f97782d458aa757e947eab2fbdf6b5c187b74561eb78f',
						'session',
						identityId,
						null,
						new Date('2019-09-04 12:30'),
						null,
						new Date('2019-09-04 12:00'),
					],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`SELECT "roles"
					         FROM "tenant"."identity"
					         WHERE "id" = ?`,
					parameters: [identityId],
					response: { rows: [{ roles: [] }] },
				},
				{
					sql: SQL`SELECT "project"."id", "project"."name", "project"."slug"
					         FROM "tenant"."project"
					         WHERE "project"."id" IN (SELECT "project_id" FROM "tenant"."project_membership" WHERE "identity_id" = ?) AND
							         "project"."id" IN (SELECT "project_id" FROM "tenant"."project_membership" WHERE "identity_id" = ?)`,
					parameters: [identityId, identityId],
					response: { rows: [{ id: projectId, name: 'Foo', slug: 'foo' }] },
				},
				selectMembershipsSql({
					identityId: identityId,
					projectId,
					membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }],
				}),
				{
					sql: SQL`SELECT "id",
						         "email",
						         "identity_id"
					         FROM "tenant"."person"
					         WHERE "id" = ?`,
					parameters: [personId],
					response: { rows: [{ id: personId, email: email }] },
				},
				{
					sql: SQL`SELECT "project"."id",
						         "project"."name",
						         "project"."slug"
					         FROM "tenant"."project"
						              INNER JOIN "tenant"."project_member" AS "project_member" ON "project_member"."project_id" = "project"."id"
					         WHERE "project_member"."identity_id" = ?`,
					parameters: [identityId],
					response: { rows: [{ id: projectId, name: 'foo' }] },
				},
			],
			return: {
				data: {
					signIn: {
						ok: true,
						result: {
							person: {
								id: personId,
								identity: {
									projects: [
										{
											project: {
												slug: 'foo',
											},
											memberships: [
												{
													role: 'editor',
												},
											],
										},
									],
								},
							},
							token: '0000000000000000000000000000000000000000',
						},
					},
				},
			},
		})
	})
})
