import { executeTenantTest } from '../../../src/testTenant.js'
import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'
import { expect, test } from 'bun:test'

test('resetPersonMfa clears factors + backup codes and audits mfa_reset', async () => {
	const personId = testUuid(1)
	const identityId = testUuid(2)
	await executeTenantTest({
		query: {
			query: GQL`mutation($id: String!) {
				resetPersonMfa(personId: $id) { ok error { code } }
			}`,
			variables: { id: personId },
		},
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, identityId, password: '123', roles: [], email: 'jane@doe.com' },
			}),
			{
				sql: SQL`update "tenant"."person_mfa"
					set "totp_secret" = ?, "totp_secret_version" = ?, "totp_activated_at" = ?, "totp_pending_secret" = ?, "totp_pending_version" = ?, "totp_pending_created_at" = ?, "email_otp_enabled" = ?
					where "person_id" = ?`,
				parameters: [null, null, null, null, null, null, false, personId],
				response: { rowCount: 1 },
			},
			{
				sql: SQL`update "tenant"."person" set "mfa_grace_until" = ? where "id" = ?`,
				parameters: [null, personId],
				response: { rowCount: 1 },
			},
			{
				sql: SQL`delete from "tenant"."person_backup_code" where "person_id" = ?`,
				parameters: [personId],
				response: { rowCount: 2 },
			},
		],
		return: {
			data: {
				resetPersonMfa: { ok: true, error: null },
			},
		},
		expectedAuthLog: {
			type: 'mfa_reset',
			targetPersonId: personId,
			response: expect.objectContaining({ ok: true }),
		},
	})
})

test('resetPersonMfa returns PERSON_NOT_FOUND', async () => {
	const personId = testUuid(1)
	await executeTenantTest({
		query: {
			query: GQL`mutation($id: String!) {
				resetPersonMfa(personId: $id) { ok error { code } }
			}`,
			variables: { id: personId },
		},
		executes: [
			{
				sql:
					SQL`SELECT "person"."id", "person"."password_hash", "person_mfa"."totp_secret" AS "otp_secret", "person_mfa"."totp_secret_version" AS "otp_secret_version", "person_mfa"."totp_activated_at" AS "otp_activated_at", "person_mfa"."totp_pending_secret" AS "otp_pending_secret", "person_mfa"."totp_pending_version" AS "otp_pending_version", "person_mfa"."totp_pending_created_at" AS "otp_pending_created_at", coalesce("person_mfa"."email_otp_enabled", false) AS "email_otp_enabled", "person"."identity_id", "person"."email", "person"."name", "person"."disabled_at", "person"."passwordless_enabled", "person"."mfa_grace_until", "person"."mfa_grace_until" is not null and "person"."mfa_grace_until" > now() AS "is_in_grace", "person"."email_verified_at", "person"."email_verification_required", "identity"."roles"
					FROM "tenant"."person"
						INNER JOIN "tenant"."identity" AS "identity" ON "identity"."id" = "person"."identity_id"
						LEFT JOIN "tenant"."person_mfa" AS "person_mfa" ON "person_mfa"."person_id" = "person"."id"
					WHERE "person"."id" = ?`,
				parameters: [personId],
				response: { rows: [] },
			},
		],
		return: {
			data: {
				resetPersonMfa: { ok: false, error: { code: 'PERSON_NOT_FOUND' } },
			},
		},
		expectedAuthLog: {
			type: 'mfa_reset',
			metadata: { requestedPersonId: personId },
			response: expect.objectContaining({ ok: false }),
		},
	})
})
