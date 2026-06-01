import { authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { addProjectMemberMutation } from './gql/addProjectMember.js'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'
import { createMembershipSql } from './sql/createMembershipSql.js'
import { createMembershipVariableSql } from './sql/createMembershipVariableSql.js'
import { getProjectMembershipSql } from './sql/getProjectMembershipSql.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { getPersonsByIdentitySql } from './sql/getPersonsByIdentitySql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { test } from 'bun:test'

test('add project member', async () => {
	const languageId = testUuid(999)
	const identityId = testUuid(6)
	const projectSlug = 'blog'
	const membershipId = testUuid(1)
	const projectId = testUuid(5)
	const personId = testUuid(7)
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
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: [{ role, variables: [{ name: variableName, values }] }],
			}),
			getPersonsByIdentitySql({
				identityIds: [identityId],
				response: [{ personId, identityId, email: 'john@doe.com' }],
			}),
		],
		return: {
			data: {
				addProjectMember: {
					ok: true,
					errors: [],
				},
			},
		},
		expectedAuthLog: {
			type: 'project_membership_create',
			response: { ok: true, result: null },
			targetPersonId: personId,
			eventData: {
				projectId,
				identityId,
				before: [],
				after: [{ role, variables: [{ name: variableName, values }] }],
			},
		},
	})
})
