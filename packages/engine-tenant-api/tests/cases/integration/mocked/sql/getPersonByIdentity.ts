import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'
import { Buffer } from 'buffer'

export const getPersonByIdentity = (args: {
	identityId: string
	response:
		| null
		| {
			personId: string
			password: string
			roles: string[]
			email: string
			name?: string
			otpUri?: string
			otpPendingUri?: string
			emailOtpEnabled?: boolean
		}
}): ExpectedQuery => ({
	sql:
		SQL`SELECT "person"."id", "person"."password_hash", "person_mfa"."totp_secret" AS "otp_secret", "person_mfa"."totp_secret_version" AS "otp_secret_version", "person_mfa"."totp_activated_at" AS "otp_activated_at", "person_mfa"."totp_pending_secret" AS "otp_pending_secret", "person_mfa"."totp_pending_version" AS "otp_pending_version", "person_mfa"."totp_pending_created_at" AS "otp_pending_created_at", coalesce("person_mfa"."email_otp_enabled", false) AS "email_otp_enabled", "person"."identity_id", "person"."email", "person"."name", "person"."disabled_at", "person"."passwordless_enabled", "person"."mfa_grace_until", "identity"."roles"
	         FROM "tenant"."person"
		              INNER JOIN "tenant"."identity" AS "identity" ON "identity"."id" = "person"."identity_id"
		              LEFT JOIN "tenant"."person_mfa" AS "person_mfa" ON "person_mfa"."person_id" = "person"."id"
	         WHERE "person"."identity_id" = ?`,
	parameters: [args.identityId],
	response: {
		rows: args.response
			? [
				{
					id: args.response.personId,
					password_hash: `BCRYPTED-${args.response.password}`,
					identity_id: args.identityId,
					roles: args.response.roles,
					email: args.response.email,
					name: args.response.name,
					otp_secret: args.response.otpUri ? Buffer.from(args.response.otpUri, 'utf8') : null,
					otp_secret_version: args.response.otpUri ? 0 : null,
					otp_activated_at: args.response.otpUri ? new Date() : null,
					otp_pending_secret: args.response.otpPendingUri ? Buffer.from(args.response.otpPendingUri, 'utf8') : null,
					otp_pending_version: args.response.otpPendingUri ? 0 : null,
					email_otp_enabled: args.response.emailOtpEnabled ?? false,
				},
			]
			: [],
	},
})
