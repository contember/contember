import { testUuid } from '../../../src/testUuid'
import { executeTenantTest } from '../../../src/testTenant'
import { selectMembershipsSql } from './sql/selectMembershipsSql'
import { patchVariablesSql } from './sql/patchVariablesSql'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql'
import { sqlTransaction } from './sql/sqlTransaction'
import { getProjectMembershipSql } from './sql/getProjectMembershipSql'
import { createMembershipSql } from './sql/createMembershipSql'
import { updateProjectMemberMutation } from './gql/updateProjectMember'
import { test } from 'uvu'

test('update project member', async () => {
	const identityId = testUuid(6)
	const projectSlug = 'blog'
	const projectId = testUuid(5)
	const membershipId = testUuid(1)
	const variableId = testUuid(2)
	const languageId1 = testUuid(600)
	const languageId2 = testUuid(500)
	const role = 'editor'
	const variableName = 'language'
	await executeTenantTest({
		query: updateProjectMemberMutation({
			identityId,
			projectSlug,
			memberships: [{ role, variables: [{ name: variableName, values: [languageId1] }] }],
		}),
		executes: [
			getProjectBySlugSql({
				projectSlug: projectSlug,
				response: { id: projectId, name: 'Blog', slug: projectSlug, config: {} },
			}),
			selectMembershipsSql({
				identityId: identityId,
				projectId: projectId,
				membershipsResponse: [{ role, variables: [{ name: variableName, values: [languageId2] }] }],
			}),
			...sqlTransaction(
				getProjectMembershipSql({ projectId, identityId }, true),
				createMembershipSql({ identityId, projectId, membershipId, role }),
				patchVariablesSql({
					membershipId,
					values: [languageId1],
					removeValues: [languageId2],
					variableName: variableName,
					id: variableId,
				}),
			),
		],
		return: {
			data: {
				updateProjectMember: {
					ok: true,
					errors: [],
				},
			},
		},
	})
})

test.run()
