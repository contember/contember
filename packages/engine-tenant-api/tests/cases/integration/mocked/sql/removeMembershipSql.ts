import { SQL } from '../../../../src/tags.js'
import { ExpectedQuery } from '@contember/database-tester'

/** RemoveProjectMembershipCommand — delete a single (project, identity, role) membership. */
export const removeMembershipSql = (args: {
	projectId: string
	identityId: string
	role: string
}): ExpectedQuery => ({
	sql: SQL`DELETE FROM "tenant"."project_membership"
	         WHERE "project_id" = ? AND "identity_id" = ? AND "role" = ?`,
	parameters: [args.projectId, args.identityId, args.role],
	response: { rowCount: 1 },
})
