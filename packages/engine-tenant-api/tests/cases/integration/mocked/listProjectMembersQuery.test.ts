import { executeTenantTest } from '../../../src/testTenant.js'
import { GQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { test } from 'bun:test'
import { sqlTransaction } from './sql/sqlTransaction.js'

const lapsedAt = new Date('2024-01-01T00:00:00.000Z')

test('list project members by email query with stable pagination order', async () => {
	await executeTenantTest({
		query: {
			query: GQL`
query {	
	projectBySlug(slug: "sandbox") {
		members(
			input: {
				filter: { email: ["foo@localhost", "bar@localhost"], memberType: PERSON }
				limit: 10
				offset: 20
			}
		) {
			identity {
				id
			}
			memberships {
				role
				active
				leaseExpiresAt
				variables {
					name
					values
				}
			}
		}
	}
}`,
			variables: {},
		},
		executes: [
			{
				sql: `SELECT "id", "name", "slug", "config", "updated_at" AS "updatedAt"
                      FROM "tenant"."project"
                      WHERE "slug" = ?`,
				parameters: ['sandbox'],
				response: { rows: [{ id: testUuid(1), name: 'sandbox', slug: 'sandbox', config: {}, updatedAt: new Date() }] },
			},
			...sqlTransaction(
				{
					sql: `select "id", "description"  from "tenant"."identity"  
                            where exists (select ?::int  from "tenant"."project_membership"  
                                                         where "project_membership"."identity_id" = "identity"."id" and "project_id" = ?) 
				              and exists (select ?::int  from "tenant"."person"  where "person"."identity_id" = "identity"."id" and "email" in (?, ?))
				            order by "identity"."id" asc limit 10 offset 20`,
					parameters: [1, testUuid(1), 1, 'foo@localhost', 'bar@localhost'],
					response: {
						rows: [
							{ id: testUuid(2), description: 'foobar' },
							{ id: testUuid(3), description: 'lapsed' },
						],
					},
				},
				{
					sql:
						`with "memberships" as (select "project_membership"."id", "project_membership"."role", "project_membership"."identity_id", "project_membership"."lease_expires_at"  from "tenant"."project_membership"  where "identity_id" in (?, ?) and "project_id" = ?), "variables" as (select "membership_id", json_agg(json_build_object('name', variable, 'values', value)) as "variables"  from "tenant"."project_membership_variable" inner join  "memberships" on  "project_membership_variable"."membership_id" = "memberships"."id"   group by "membership_id") select "role", coalesce(variables, '[]'::json) as "variables", "identity_id" as "identityId", "memberships"."lease_expires_at" as "leaseExpiresAt", ("memberships"."lease_expires_at" is null or "memberships"."lease_expires_at" > now()) as "active"  from "memberships" left join  "variables" on  "memberships"."id" = "variables"."membership_id"`,
					parameters: [testUuid(2), testUuid(3), testUuid(1)],
					response: {
						rows: [
							{
								role: 'foo',
								variables: [{ values: ['x', 'y'], name: 'xyz' }],
								identityId: testUuid(2),
								leaseExpiresAt: null,
								active: true,
							},
							{
								role: 'bar',
								variables: [],
								identityId: testUuid(3),
								leaseExpiresAt: lapsedAt,
								active: false,
							},
						],
					},
				},
			),
		],
		return: {
			data: {
				projectBySlug: {
					members: [
						{
							identity: { id: testUuid(2) },
							memberships: [{ role: 'foo', active: true, leaseExpiresAt: null, variables: [{ name: 'xyz', values: ['x', 'y'] }] }],
						},
						{
							identity: { id: testUuid(3) },
							memberships: [{ role: 'bar', active: false, leaseExpiresAt: lapsedAt.toISOString(), variables: [] }],
						},
					],
				},
			},
		},
	})
})
