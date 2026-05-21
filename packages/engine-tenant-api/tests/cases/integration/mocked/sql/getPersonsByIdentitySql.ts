import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

export const getPersonsByIdentitySql = (args: {
	identityIds: readonly string[]
	response: readonly { personId: string; identityId: string; email: string; password?: string; roles?: readonly string[] }[]
}): ExpectedQuery => ({
	sql:
		SQL`SELECT "person"."id", "person"."password_hash", "person_mfa"."totp_secret" AS "otp_secret", "person_mfa"."totp_secret_version" AS "otp_secret_version", "person_mfa"."totp_activated_at" AS "otp_activated_at", "person_mfa"."totp_pending_secret" AS "otp_pending_secret", "person_mfa"."totp_pending_version" AS "otp_pending_version", "person_mfa"."totp_pending_created_at" AS "otp_pending_created_at", coalesce("person_mfa"."email_otp_enabled", false) AS "email_otp_enabled", "person"."identity_id", "person"."email", "person"."name", "person"."disabled_at", "person"."passwordless_enabled", "identity"."roles"
	         FROM "tenant"."person"
		              INNER JOIN "tenant"."identity" AS "identity" ON "identity"."id" = "person"."identity_id"
		              LEFT JOIN "tenant"."person_mfa" AS "person_mfa" ON "person_mfa"."person_id" = "person"."id"
	         WHERE "person"."identity_id" IN (${args.identityIds.map(() => '?').join(', ')})`,
	parameters: [...args.identityIds],
	response: {
		rows: args.response.map(it => ({
			id: it.personId,
			password_hash: it.password ? `BCRYPTED-${it.password}` : null,
			identity_id: it.identityId,
			roles: it.roles ?? [],
			email: it.email,
		})),
	},
})
