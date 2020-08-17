import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'

export const getPersonByIdSql = (args: {
	personId: string
	response: { personId: string; password: string; identityId: string; roles: string[]; email: string }
}): ExpectedQuery => ({
	sql: SQL`SELECT "person"."id", "person"."password_hash", "person"."otp_uri", "person"."otp_activated_at", "person"."identity_id", "person"."email", "identity"."roles"
	         FROM "tenant"."person"
		              INNER JOIN "tenant"."identity" AS "identity" ON "identity"."id" = "person"."identity_id"
	         WHERE "person"."id" = ?`,
	parameters: [args.personId],
	response: {
		rows: [
			{
				id: args.response.personId,
				password_hash: `BCRYPTED-${args.response.password}`,
				identity_id: args.response.identityId,
				roles: args.response.roles,
				mail: args.response.email,
			},
		],
	},
})
