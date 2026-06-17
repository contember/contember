import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

export interface ListPersonsResponseRow {
	personId: string
	identityId: string
	email: string
	name?: string
	roles?: string[]
	password?: string
	emailOtpEnabled?: boolean
}

export const listPersonsSql = (args: {
	emailFilter?: string
	rows: ListPersonsResponseRow[]
}): ExpectedQuery => ({
	sql: args.emailFilter
		? SQL`SELECT "person"."id", "person"."password_hash", "person_mfa"."totp_secret" AS "otp_secret", "person_mfa"."totp_secret_version" AS "otp_secret_version", "person_mfa"."totp_activated_at" AS "otp_activated_at", "person_mfa"."totp_pending_secret" AS "otp_pending_secret", "person_mfa"."totp_pending_version" AS "otp_pending_version", "person_mfa"."totp_pending_created_at" AS "otp_pending_created_at", coalesce("person_mfa"."email_otp_enabled", false) AS "email_otp_enabled", "person"."identity_id", "person"."email", "person"."name", "person"."disabled_at", "person"."passwordless_enabled", "person"."mfa_grace_until", "person"."email_verified_at", "person"."email_verification_required", "identity"."roles"
			     FROM "tenant"."person"
			          INNER JOIN "tenant"."identity" AS "identity" ON "identity"."id" = "person"."identity_id"
			          LEFT JOIN "tenant"."person_mfa" AS "person_mfa" ON "person_mfa"."person_id" = "person"."id"
			     WHERE "person"."email" ILIKE '%' || ? || '%'
			     ORDER BY "person"."email" ASC`
		: SQL`SELECT "person"."id", "person"."password_hash", "person_mfa"."totp_secret" AS "otp_secret", "person_mfa"."totp_secret_version" AS "otp_secret_version", "person_mfa"."totp_activated_at" AS "otp_activated_at", "person_mfa"."totp_pending_secret" AS "otp_pending_secret", "person_mfa"."totp_pending_version" AS "otp_pending_version", "person_mfa"."totp_pending_created_at" AS "otp_pending_created_at", coalesce("person_mfa"."email_otp_enabled", false) AS "email_otp_enabled", "person"."identity_id", "person"."email", "person"."name", "person"."disabled_at", "person"."passwordless_enabled", "person"."mfa_grace_until", "person"."email_verified_at", "person"."email_verification_required", "identity"."roles"
			     FROM "tenant"."person"
			          INNER JOIN "tenant"."identity" AS "identity" ON "identity"."id" = "person"."identity_id"
			          LEFT JOIN "tenant"."person_mfa" AS "person_mfa" ON "person_mfa"."person_id" = "person"."id"
			     ORDER BY "person"."email" ASC`,
	parameters: args.emailFilter ? [args.emailFilter] : [],
	response: {
		rows: args.rows.map(row => ({
			id: row.personId,
			password_hash: `BCRYPTED-${row.password ?? '123'}`,
			identity_id: row.identityId,
			roles: row.roles ?? [],
			email: row.email,
			name: row.name,
			email_otp_enabled: row.emailOtpEnabled ?? false,
			otp_uri: null,
			otp_activated_at: null,
			disabled_at: null,
			passwordless_enabled: null,
			email_verified_at: null,
			email_verification_required: false,
		})),
	},
})
