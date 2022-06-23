import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'
import { testUuid } from '../../../../src/testUuid.js'

export const getProjectMembershipSql = (
	args: { identityId: string; projectId: string },
	response?: boolean,
): ExpectedQuery => ({
	sql: SQL`SELECT "id"
	         FROM "tenant"."project_membership"
	         WHERE "project_id" = ? AND "identity_id" = ?`,
	parameters: [args.projectId, args.identityId],
	response: {
		rows: response ? [{ id: testUuid(123) }] : [],
	},
})
