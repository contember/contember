import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'

export const getPersonByEmailSql = (args: {
	email: string
	response: null | { personId: string; password: string; identityId: string; roles: string[]; otpUri?: string }
}): ExpectedQuery => ({
	sql: SQL`SELECT "person"."id", "person"."password_hash", "person"."otp_uri", "person"."otp_activated_at", "person"."identity_id", "person"."email", "identity"."roles"
	         FROM "tenant"."person"
		              INNER JOIN "tenant"."identity" AS "identity" ON "identity"."id" = "person"."identity_id"
	         WHERE "person"."email" = ?`,
	parameters: [args.email],
	response: {
		rows: args.response
			? [
				{
					id: args.response.personId,
					password_hash: `BCRYPTED-${args.response.password}`,
					identity_id: args.response.identityId,
					roles: args.response.roles,
					email: args.email,
					otp_uri: args.response.otpUri,
					otp_activated_at: args.response.otpUri ? new Date() : null,
				},
			  ]
			: [],
	},
})
