import { describe, test } from 'bun:test'
import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { GQL, SQL } from '../../../src/tags.js'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'

const projectId = testUuid(1)
const memberId = testUuid(2)
// the membership listing groups rows by `identityId`
const memberships = [{ role: 'reviewer', variables: [], identityId: memberId }]

const membersQuery = (memberType: string) =>
	GQL`query {
		projectBySlug(slug: "sandbox") {
			members(input: { filter: { memberType: ${memberType} } }) {
				identity { id }
			}
		}
	}`

const membersTest = async (memberType: string, filterSql: string) => {
	await executeTenantTest({
		query: membersQuery(memberType),
		executes: [
			getProjectBySlugSql({ projectSlug: 'sandbox', response: { id: projectId, name: 'sandbox', slug: 'sandbox', config: {} } }),
			...sqlTransaction(
				{
					sql: SQL`select "id", "description" from "tenant"."identity"
						where exists (select ?::int from "tenant"."project_membership"
							where "project_membership"."identity_id" = "identity"."id" and "project_id" = ?)
						and ${filterSql}
						order by "identity"."id" asc`,
					parameters: [1, projectId, ...filterSql.split('?').slice(1).map(() => 1)],
					response: { rows: [{ id: memberId, description: 'a trust' }] },
				},
				selectMembershipsSql({ identityId: memberId, projectId, membershipsResponse: memberships }),
			),
		],
		return: { data: { projectBySlug: { members: [{ identity: { id: memberId } }] } } },
	})
}

describe('Project.members memberType filter', () => {
	test('WORKLOAD lists identities referenced by a trust', async () => {
		await membersTest(
			'WORKLOAD',
			SQL`exists (select ?::int from "tenant"."workload_identity_trust" where "workload_identity_trust"."identity_id" = "identity"."id")`,
		)
	})

	test('API_KEY excludes persons and workload identities', async () => {
		await membersTest(
			'API_KEY',
			SQL`not(exists (select ?::int from "tenant"."person" where "person"."identity_id" = "identity"."id"))
				and not(exists (select ?::int from "tenant"."workload_identity_trust" where "workload_identity_trust"."identity_id" = "identity"."id"))`,
		)
	})
})
