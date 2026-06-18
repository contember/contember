import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

export interface ListPersonsResponseRow {
	personId: string
	identityId: string
	email: string
	name?: string
	emailOtpEnabled?: boolean
}

const COLUMNS =
	'"person"."id", "person"."identity_id", "person"."email", "person"."name", "person_mfa"."totp_activated_at" AS "otp_activated_at", coalesce("person_mfa"."email_otp_enabled", false) AS "email_otp_enabled", "person"."passwordless_enabled", "person"."email_verified_at"'

const FROM = `FROM "tenant"."person"
	LEFT JOIN "tenant"."person_mfa" AS "person_mfa" ON "person_mfa"."person_id" = "person"."id"`

/**
 * Slim person listing emitted by `PersonsQuery` — no `password_hash` / TOTP
 * secrets, capped to `limit 100 offset 0` by default. Supports the `email` and
 * `identityIds` (scoped) filter variants.
 */
export const listPersonsSql = (args: {
	emailFilter?: string
	identityIds?: string[]
	rows: ListPersonsResponseRow[]
}): ExpectedQuery => {
	const where: string[] = []
	const parameters: unknown[] = []
	if (args.emailFilter) {
		where.push(`"person"."email" ILIKE '%' || ? || '%'`)
		parameters.push(args.emailFilter)
	}
	if (args.identityIds) {
		where.push(`"person"."identity_id" IN (${args.identityIds.map(() => '?').join(', ')})`)
		parameters.push(...args.identityIds)
	}
	const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
	return {
		sql: SQL`SELECT ${COLUMNS} ${FROM} ${whereSql} ORDER BY "person"."email" ASC limit 100 offset 0`,
		parameters,
		response: {
			rows: args.rows.map(row => ({
				id: row.personId,
				identity_id: row.identityId,
				email: row.email,
				name: row.name ?? null,
				otp_activated_at: null,
				email_otp_enabled: row.emailOtpEnabled ?? false,
				passwordless_enabled: null,
				email_verified_at: null,
			})),
		},
	}
}
