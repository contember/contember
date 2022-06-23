import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { executeTenantTest } from '../../../src/testTenant.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { test } from 'vitest'

test('removes a project member', async () => {
	const identityId = testUuid(6)
	const projectId = testUuid(5)
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
				membershipsResponse: [{ role: 'editor', variables: [] }],
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
		],
		return: {
			data: {
				removeProjectMember: {
					ok: true,
					errors: [],
				},
			},
		},
	})
})

