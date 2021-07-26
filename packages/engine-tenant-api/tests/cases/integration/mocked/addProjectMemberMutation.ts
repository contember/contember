import { executeTenantTest } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { addProjectMemberMutation } from './gql/addProjectMember'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql'
import { createMembershipSql } from './sql/createMembershipSql'
import { createMembershipVariableSql } from './sql/createMembershipVariableSql'
import { getProjectMembershipSql } from './sql/getProjectMembershipSql'
import { sqlTransaction } from './sql/sqlTransaction'
import { test } from 'uvu'

test('add project member', async () => {
	const languageId = testUuid(999)
	const identityId = testUuid(6)
	const projectSlug = 'blog'
	const membershipId = testUuid(1)
	const projectId = testUuid(5)
	const role = 'editor'
	const variableId = testUuid(2)
	const variableName = 'language'
	const values = [languageId]
	await executeTenantTest({
		query: addProjectMemberMutation({
			projectSlug: projectSlug,
			identityId: identityId,
			memberships: [{ role, variables: [{ name: variableName, values }] }],
		}),
		executes: [
			getProjectBySlugSql({ projectSlug, response: { id: projectId, name: 'Blog', slug: projectSlug, config: {} } }),
			...sqlTransaction(
				getProjectMembershipSql({ identityId, projectId }),
				createMembershipSql({ membershipId, projectId, identityId, role }),
				createMembershipVariableSql({ variableId, membershipId, variableName, values }),
			),
		],
		return: {
			data: {
				addProjectMember: {
					ok: true,
					errors: [],
				},
			},
		},
	})
})

test.run()
