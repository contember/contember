import { executeTenantTest } from '../../../src/testTenant'
import { GQL, SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { getPersonByIdSql } from './sql/getPersonByIdSql'
import { getMailTemplateSql } from './sql/getMailTemplateSql'
import { expect, test } from 'bun:test'

const disableIdentityApiKeysSql = (identityId: string) => ({
	sql: SQL`update "tenant"."api_key" set "disabled_at" = ? where "identity_id" = ?`,
	parameters: [(val: any) => val instanceof Date, identityId],
	response: { rowCount: 1 },
})

test('force sign-out – success with reason and mail', async () => {
	const personId = testUuid(1)
	const identityId = testUuid(2)

	await executeTenantTest({
		query: {
			query: GQL`mutation($id: String!, $reason: String) {
				forceSignOutPerson(personId: $id, reason: $reason) {
					ok
					error { code }
				}
			}`,
			variables: { id: personId, reason: 'security incident' },
		},
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, identityId, password: '123', roles: [], email: 'jane@doe.com' },
			}),
			disableIdentityApiKeysSql(identityId),
			getMailTemplateSql({ type: 'forcedSignOut', projectId: null }),
			getMailTemplateSql({ type: 'forcedSignOut', projectId: null }),
		],
		return: {
			data: {
				forceSignOutPerson: { ok: true, error: null },
			},
		},
		expectedAuthLog: {
			type: 'forced_sign_out',
			targetPersonId: personId,
			response: expect.objectContaining({ ok: true }),
			metadata: { reason: 'security incident' },
		},
		sentMails: [
			{
				subject: 'Your sessions have been signed out',
			},
		],
	})
})

test('force sign-out – PERSON_NOT_FOUND', async () => {
	const personId = testUuid(1)

	await executeTenantTest({
		query: {
			query: GQL`mutation($id: String!) {
				forceSignOutPerson(personId: $id) {
					ok
					error { code }
				}
			}`,
			variables: { id: personId },
		},
		executes: [
			{
				sql: SQL`SELECT "person"."id", "person"."password_hash", "person"."otp_uri", "person"."otp_activated_at", "person"."identity_id", "person"."email", "person"."name", "person"."disabled_at", "person"."passwordless_enabled", "identity"."roles"
					FROM "tenant"."person"
						INNER JOIN "tenant"."identity" AS "identity" ON "identity"."id" = "person"."identity_id"
					WHERE "person"."id" = ?`,
				parameters: [personId],
				response: { rows: [] },
			},
		],
		return: {
			data: {
				forceSignOutPerson: { ok: false, error: { code: 'PERSON_NOT_FOUND' } },
			},
		},
		expectedAuthLog: {
			type: 'forced_sign_out',
			targetPersonId: personId,
			response: expect.objectContaining({ ok: false }),
		},
	})
})
