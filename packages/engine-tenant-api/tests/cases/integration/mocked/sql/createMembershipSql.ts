import { Membership } from '../../../../../src/model/type/Membership'
import { SQL } from '../../../../src/tags'
import { ExpectedQuery } from '@contember/database-tester'

export const createMembershipSql = (args: {
	membershipId: string
	identityId: string
	projectId: string
	role: string
}): ExpectedQuery => ({
	sql: SQL`INSERT INTO "tenant"."project_membership" ("id", "project_id", "identity_id", "role")
	         VALUES (?, ?, ?, ?)
	         ON CONFLICT ("project_id", "identity_id", "role") DO UPDATE SET "role" = ?
	         RETURNING "id"`,
	parameters: [args.membershipId, args.projectId, args.identityId, args.role, args.role],
	response: {
		rows: [{ id: args.membershipId }],
	},
})
