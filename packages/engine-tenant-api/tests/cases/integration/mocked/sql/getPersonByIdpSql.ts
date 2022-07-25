import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'

export const getPersonByIdpSql = (args: {
	identityProviderId: string
	externalIdentifier: string
	response: null | { personId: string; password?: string; identityId: string; email: string; roles: string[]; otpUri?: string }
}): ExpectedQuery => ({
	sql: SQL`SELECT "person"."id", "person"."password_hash", "person"."otp_uri", "person"."otp_activated_at", "person"."identity_id", "person"."email", "person"."name", "identity"."roles"
	         FROM "tenant"."person"
		        INNER JOIN "tenant"."identity" AS "identity" ON "identity"."id" = "person"."identity_id"
				INNER JOIN  "tenant"."person_identity_provider" as "idp" on  "idp"."person_id" = "person"."id"
	        WHERE "identity_provider_id" = ? and "external_identifier" = ?
		              `,
	parameters: [args.identityProviderId, args.externalIdentifier],
	response: {
		rows: args.response
			? [
				{
					id: args.response.personId,
					password_hash: `BCRYPTED-${args.response.password}`,
					identity_id: args.response.identityId,
					roles: args.response.roles,
					email: args.response.email,
					otp_uri: args.response.otpUri,
					otp_activated_at: args.response.otpUri ? new Date() : null,
				},
			  ]
			: [],
	},
})
