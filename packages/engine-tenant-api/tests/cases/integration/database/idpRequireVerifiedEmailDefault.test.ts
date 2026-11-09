import { expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { createDatabaseTenant, databaseConfigured } from '../../../src/databaseTenant.js'

test.skipIf(!databaseConfigured)('an IdP added without options does not link an existing account by an unverified e-mail', async () => {
	const slug = `idp-${crypto.randomUUID()}`
	const email = `${crypto.randomUUID()}@example.com`
	const adminId = crypto.randomUUID()
	const identityId = crypto.randomUUID()
	const personId = crypto.randomUUID()
	const tenant = createDatabaseTenant()
	const execute = async (roles: string[], source: string, variables: Record<string, unknown>) => {
		const response = await tenant.execute({ identityId: adminId, roles }, source, variables)
		expect(response.errors).toBeUndefined()
		return response.data
	}

	try {
		for (const [id, roles] of [[adminId, ['super_admin']], [identityId, ['person']]] as const) {
			await tenant.client.query(
				'INSERT INTO "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at") VALUES (?, ?, ?::jsonb, ?, now())',
				[id, null, JSON.stringify(roles), 'idp verified e-mail test'],
			)
		}
		await tenant.client.query('INSERT INTO "tenant"."person" ("id", "identity_id", "email") VALUES (?, ?, ?)', [personId, identityId, email])

		expect(
			await execute(
				['super_admin'],
				`mutation($slug: String!, $configuration: Json!) {
					addIDP(identityProvider: $slug, type: "mock", configuration: $configuration) { ok }
				}`,
				{ slug, configuration: { externalIdentifier: crypto.randomUUID(), email, emailVerified: false } },
			),
		).toEqual({ addIDP: { ok: true } })

		expect(
			await execute(
				['login'],
				`mutation($slug: String!) {
					signInIDP(identityProvider: $slug, idpResponse: { url: "test" }, redirectUrl: "test", sessionData: {}) {
						ok
						errors { code }
					}
				}`,
				{ slug },
			),
		).toEqual({ signInIDP: { ok: false, errors: [{ code: 'PERSON_NOT_FOUND' }] } })

		const links = await tenant.client.query('SELECT 1 FROM "tenant"."person_identity_provider" WHERE "person_id" = ?', [personId])
		expect(links.rowCount).toBe(0)
	} finally {
		await tenant.client.query('DELETE FROM "tenant"."person_identity_provider" WHERE "person_id" = ?', [personId])
		await tenant.client.query('DELETE FROM "tenant"."person_auth_log" WHERE "invoked_by_id" = ? OR "person_id" = ?', [adminId, personId])
		await tenant.client.query('DELETE FROM "tenant"."api_key" WHERE "identity_id" = ?', [identityId])
		await tenant.client.query('DELETE FROM "tenant"."identity_provider" WHERE "slug" = ?', [slug])
		await tenant.client.query('DELETE FROM "tenant"."person" WHERE "id" = ?', [personId])
		await tenant.client.query('DELETE FROM "tenant"."identity" WHERE "id" IN (?, ?)', [adminId, identityId])
		await tenant.end()
	}
})
