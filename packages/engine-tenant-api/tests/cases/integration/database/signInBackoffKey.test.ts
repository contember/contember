import { afterAll, beforeAll, expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { createDatabaseTenant, databaseConfigured } from '../../../src/databaseTenant.js'

const signIn = `mutation($email: String!, $password: String!) {
	signIn(email: $email, password: $password) { ok errors { code } }
}`

let tenant: ReturnType<typeof createDatabaseTenant>
const callerId = crypto.randomUUID()
const caller = { identityId: callerId, roles: ['login'] }
let previousBaseBackoff: string

beforeAll(async () => {
	if (!databaseConfigured) {
		return
	}
	tenant = createDatabaseTenant()
	await tenant.client.query(
		'INSERT INTO "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at") VALUES (?, ?, ?::jsonb, ?, now())',
		[callerId, null, JSON.stringify(['login']), 'sign-in backoff test'],
	)
	const config = await tenant.client.query<{ login_base_backoff: string }>('SELECT "login_base_backoff"::text FROM "tenant"."config"')
	previousBaseBackoff = config.rows[0].login_base_backoff
	// Long enough that the second attempt always lands inside the backoff.
	await tenant.client.query(`UPDATE "tenant"."config" SET "login_base_backoff" = interval '1 minute'`)
})

afterAll(async () => {
	if (!databaseConfigured) {
		return
	}
	await tenant.client.query('UPDATE "tenant"."config" SET "login_base_backoff" = ?::interval', [previousBaseBackoff])
	await tenant.client.query('DELETE FROM "tenant"."person_auth_log" WHERE "invoked_by_id" = ?', [callerId])
	await tenant.client.query('DELETE FROM "tenant"."identity" WHERE "id" = ?', [callerId])
	await tenant.end()
})

const attempt = async (email: string, password: string) => {
	const response = await tenant.execute(caller, signIn, { email, password })
	expect(response.errors).toBeUndefined()
	return response.data?.signIn
}

test.skipIf(!databaseConfigured)('failed sign-ins under different spellings of a known address share one backoff', async () => {
	const identityId = crypto.randomUUID()
	const personId = crypto.randomUUID()
	const local = crypto.randomUUID()
	const password = 'correct horse battery staple'
	try {
		await tenant.client.query(
			'INSERT INTO "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at") VALUES (?, ?, ?::jsonb, ?, now())',
			[identityId, null, JSON.stringify(['person']), 'sign-in backoff test'],
		)
		await tenant.client.query('INSERT INTO "tenant"."person" ("id", "identity_id", "email", "password_hash") VALUES (?, ?, ?, ?)', [
			personId,
			identityId,
			`${local}@example.com`,
			await tenant.providers.bcrypt(password),
		])

		expect(await attempt(`${local}@example.com`, 'wrong')).toEqual({ ok: false, errors: [{ code: 'INVALID_PASSWORD' }] })
		expect(await attempt(` ${local.toUpperCase()}@Example.com`, password)).toEqual({ ok: false, errors: [{ code: 'RATE_LIMIT_EXCEEDED' }] })
	} finally {
		await tenant.client.query('DELETE FROM "tenant"."person_auth_log" WHERE "person_id" = ?', [personId])
		await tenant.client.query('DELETE FROM "tenant"."api_key" WHERE "identity_id" = ?', [identityId])
		await tenant.client.query('DELETE FROM "tenant"."person" WHERE "id" = ?', [personId])
		await tenant.client.query('DELETE FROM "tenant"."identity" WHERE "id" = ?', [identityId])
	}
})

test.skipIf(!databaseConfigured)('failed sign-ins under different spellings of an unknown address share one backoff', async () => {
	const local = crypto.randomUUID()

	expect(await attempt(`${local}@Example.com`, 'wrong')).toEqual({ ok: false, errors: [{ code: 'UNKNOWN_EMAIL' }] })
	expect(await attempt(`${local.toUpperCase()}@example.com `, 'wrong')).toEqual({ ok: false, errors: [{ code: 'RATE_LIMIT_EXCEEDED' }] })
})
