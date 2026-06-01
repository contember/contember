import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { executeTenantTest } from '../../../src/testTenant.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { getPersonsByIdentitySql } from './sql/getPersonsByIdentitySql.js'
import { test } from 'bun:test'

test('removes a project member', async () => {
	const identityId = testUuid(6)
	const projectId = testUuid(5)
	const personId = testUuid(7)
	const role = 'editor'
	const beforeMemberships = [{ role, variables: [] }]
	await executeTenantTest({
		query: GQL`mutation {
          removeProjectMember(projectSlug: "blog", identityId: "${identityId}") {
            ok
	          errors {
		          code
	          }
          }
        }`,
		executes: [
			getProjectBySlugSql({ projectSlug: 'blog', response: { id: projectId, name: 'Blog', slug: 'blog', config: {} } }),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: beforeMemberships,
			}),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: beforeMemberships,
			}),
			...sqlTransaction({
				sql: SQL`DELETE
						         FROM "tenant"."project_membership"
						         WHERE "project_id" = ? AND "identity_id" = ?`,
				parameters: [projectId, identityId],
				response: {
					rowCount: 1,
				},
			}),
			getPersonsByIdentitySql({
				identityIds: [identityId],
				response: [{ personId, identityId, email: 'john@doe.com' }],
			}),
		],
		return: {
			data: {
				removeProjectMember: {
					ok: true,
					errors: [],
				},
			},
		},
		expectedAuthLog: {
			type: 'project_membership_remove',
			response: { ok: true, result: null },
			targetPersonId: personId,
			eventData: {
				projectId,
				identityId,
				before: beforeMemberships,
				after: [],
			},
		},
	})
})
