import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

export interface PersonIdpConnectionRow {
	id: string
	createdAt: Date
	externalIdentifier: string
	slug: string
	type: string
	disabledAt?: Date | null
}

export const getPersonIdentityProvidersSql = (args: {
	personId: string
	response: PersonIdpConnectionRow[]
}): ExpectedQuery => ({
	sql:
		SQL`SELECT "person_identity_provider"."id", "person_identity_provider"."created_at" as "createdAt", "person_identity_provider"."external_identifier" as "externalIdentifier", "identity_provider"."slug" as "identityProviderSlug", "identity_provider"."type" as "identityProviderType", "identity_provider"."disabled_at" as "identityProviderDisabledAt"
	         FROM "tenant"."person_identity_provider"
		              INNER JOIN "tenant"."identity_provider" AS "identity_provider" ON "identity_provider"."id" = "person_identity_provider"."identity_provider_id"
	         WHERE "person_id" = ?
	         ORDER BY "person_identity_provider"."created_at" ASC, "person_identity_provider"."id" ASC`,
	parameters: [args.personId],
	response: {
		rows: args.response.map(it => ({
			id: it.id,
			createdAt: it.createdAt,
			externalIdentifier: it.externalIdentifier,
			identityProviderSlug: it.slug,
			identityProviderType: it.type,
			identityProviderDisabledAt: it.disabledAt ?? null,
		})),
	},
})

/**
 * Person-by-identity lookup with explicit control over the auth-method columns
 * (`password_hash`, `passwordless_enabled`) that the disconnect lock-out check
 * reads. The generic `getPersonByIdentity` helper always returns a non-null
 * password hash, which would mask the lock-out path.
 */
export const getPersonByIdentityForIdp = (args: {
	identityId: string
	personId: string
	passwordHash: string | null
	passwordlessEnabled?: boolean | null
}): ExpectedQuery => ({
	sql:
		SQL`SELECT "person"."id", "person"."password_hash", "person_mfa"."totp_secret" AS "otp_secret", "person_mfa"."totp_secret_version" AS "otp_secret_version", "person_mfa"."totp_activated_at" AS "otp_activated_at", "person_mfa"."totp_pending_secret" AS "otp_pending_secret", "person_mfa"."totp_pending_version" AS "otp_pending_version", "person_mfa"."totp_pending_created_at" AS "otp_pending_created_at", coalesce("person_mfa"."email_otp_enabled", false) AS "email_otp_enabled", "person"."identity_id", "person"."email", "person"."name", "person"."disabled_at", "person"."passwordless_enabled", "person"."mfa_grace_until", "person"."mfa_grace_until" is not null and "person"."mfa_grace_until" > now() AS "is_in_grace", "person"."email_verified_at", "person"."email_verification_required", "identity"."roles"
	         FROM "tenant"."person"
		              INNER JOIN "tenant"."identity" AS "identity" ON "identity"."id" = "person"."identity_id"
		              LEFT JOIN "tenant"."person_mfa" AS "person_mfa" ON "person_mfa"."person_id" = "person"."id"
	         WHERE "person"."identity_id" = ?`,
	parameters: [args.identityId],
	response: {
		rows: [
			{
				id: args.personId,
				password_hash: args.passwordHash,
				identity_id: args.identityId,
				roles: [],
				email: 'john@doe.com',
				name: 'John',
				otp_secret: null,
				otp_secret_version: null,
				otp_activated_at: null,
				otp_pending_secret: null,
				otp_pending_version: null,
				email_otp_enabled: false,
				disabled_at: null,
				passwordless_enabled: args.passwordlessEnabled ?? null,
				email_verified_at: null,
				email_verification_required: false,
			},
		],
	},
})

export const disconnectPersonIdentityProviderSql = (args: {
	personId: string
	personIdentityProviderId: string
	affectedRows?: number
}): ExpectedQuery => ({
	sql: SQL`DELETE FROM "tenant"."person_identity_provider" WHERE "id" = ? AND "person_id" = ?`,
	parameters: [args.personIdentityProviderId, args.personId],
	response: { rowCount: args.affectedRows ?? 1 },
})
