import { executeTenantTest } from '../../../src/testTenant'
import { GQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { test } from 'vitest'
import { sqlTransaction } from './sql/sqlTransaction'

test('list project members by email query', async () => {
	await executeTenantTest({
		query: {
			query: GQL`
query {	
	projectBySlug(slug: "sandbox") {
		members(
			input: { filter: { email: ["foo@localhost", "bar@localhost"], memberType: PERSON } }
		) {
			identity {
				id
			}
			memberships {
				role
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
                              and exists (select ?::int  from "tenant"."person"  where "person"."identity_id" = "identity"."id" and "email" in (?, ?))`,
					parameters: [1, testUuid(1), 1, 'foo@localhost', 'bar@localhost'],
					response: {
						rows: [
							{ id: testUuid(2), description: 'foobar' },
						],
					},
				},
				{
					sql: `with 
    					"memberships" as (select "project_membership"."id", "project_membership"."role", "project_membership"."identity_id"  from "tenant"."project_membership"  where "identity_id" in (?) and "project_id" = ?), 
    					"variables" as (select "membership_id", json_agg(json_build_object('name', variable, 'values', value)) as "variables"  from "tenant"."project_membership_variable" inner join  "memberships" on  "project_membership_variable"."membership_id" = "memberships"."id"   group by "membership_id") 
						select "role", coalesce(variables, '[]'::json) as "variables", "identity_id" as "identityId"  from "memberships" left join  "variables" on  "memberships"."id" = "variables"."membership_id"`,
					parameters: [testUuid(2), testUuid(1)],
					response: {
						rows: [
							{
								role: 'foo',
								variables: [{ values: ['x', 'y'],  name: 'xyz' }],
								identityId: testUuid(2),
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
							memberships: [{ role: 'foo', variables: [{ name: 'xyz', values: ['x', 'y'] }] }],
						},
					],
				},
			},
		},
	})
})
