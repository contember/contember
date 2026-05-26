import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'

export const getPersonByIdSql = (args: {
	personId: string
	response: {
		personId: string
		password: string
		identityId: string
		roles: string[]
		email: string
		name?: string
		otpUri?: string
		disabledAt?: Date | null
		passwordlessEnabled?: boolean | null
		emailVerifiedAt?: Date | null
		emailVerificationRequired?: boolean
	}
}): ExpectedQuery => ({
	sql:
		SQL`SELECT "person"."id", "person"."password_hash", "person"."otp_uri", "person"."otp_activated_at", "person"."identity_id", "person"."email", "person"."name", "person"."disabled_at", "person"."passwordless_enabled", "person"."email_verified_at", "person"."email_verification_required", "identity"."roles"
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
				email: args.response.email,
				name: args.response.name,
				otp_uri: args.response.otpUri ?? null,
				otp_activated_at: args.response.otpUri ? new Date() : null,
				disabled_at: args.response.disabledAt ?? null,
				passwordless_enabled: args.response.passwordlessEnabled ?? null,
				email_verified_at: args.response.emailVerifiedAt ?? null,
				email_verification_required: args.response.emailVerificationRequired ?? false,
			},
		],
	},
})
