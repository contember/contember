import { executeTenantTest } from '../../../src/testTenant.js'
import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'
import { expect, test } from 'bun:test'

const enablePersonQuery = GQL`mutation($id: String!) {
	enablePerson(personId: $id) {
		ok
		error { code }
	}
}`

test('enablePerson clears the disabled flag', async () => {
	const personId = testUuid(1)
	const identityId = testUuid(2)

	await executeTenantTest({
		query: {
			query: enablePersonQuery,
			variables: { id: personId },
		},
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, identityId, password: '123', roles: [], email: 'jane@doe.com', disabledAt: new Date('2019-09-04 12:00') },
			}),
			{
				sql: SQL`update "tenant"."person" set "disabled_at" = ? where "id" = ?`,
				parameters: [null, personId],
				response: { rowCount: 1 },
			},
		],
		return: {
			data: {
				enablePerson: { ok: true, error: null },
			},
		},
		expectedAuthLog: {
			type: 'person_enable',
			personId,
			response: expect.objectContaining({ ok: true }),
		},
	})
})

test('enablePerson returns PERSON_NOT_FOUND', async () => {
	const personId = testUuid(1)

	await executeTenantTest({
		query: {
			query: enablePersonQuery,
			variables: { id: personId },
		},
		executes: [
			{
				sql:
					SQL`SELECT "person"."id", "person"."password_hash", "person_mfa"."totp_secret" AS "otp_secret", "person_mfa"."totp_secret_version" AS "otp_secret_version", "person_mfa"."totp_activated_at" AS "otp_activated_at", "person_mfa"."totp_pending_secret" AS "otp_pending_secret", "person_mfa"."totp_pending_version" AS "otp_pending_version", "person_mfa"."totp_pending_created_at" AS "otp_pending_created_at", coalesce("person_mfa"."email_otp_enabled", false) AS "email_otp_enabled", "person"."identity_id", "person"."email", "person"."name", "person"."disabled_at", "person"."passwordless_enabled", "person"."mfa_grace_until", "person"."email_verified_at", "person"."email_verification_required", "identity"."roles"
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
				enablePerson: { ok: false, error: { code: 'PERSON_NOT_FOUND' } },
			},
		},
	})
})

test('enablePerson returns PERSON_ALREADY_ENABLED', async () => {
	const personId = testUuid(1)
	const identityId = testUuid(2)

	await executeTenantTest({
		query: {
			query: enablePersonQuery,
			variables: { id: personId },
		},
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, identityId, password: '123', roles: [], email: 'jane@doe.com', disabledAt: null },
			}),
		],
		return: {
			data: {
				enablePerson: { ok: false, error: { code: 'PERSON_ALREADY_ENABLED' } },
			},
		},
		expectedAuthLog: {
			type: 'person_enable',
			personId,
			response: expect.objectContaining({ ok: false }),
		},
	})
})
