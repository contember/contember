import { authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant.js'
import { GQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { getApiKeySql } from './sql/getApiKeySql.js'
import { disableApiKey } from './sql/disableApiKeySql.js'
import { expect, test } from 'bun:test'
import { ApiKey } from '../../../../src/index.js'

test('revoke own session', async () => {
	const personId = testUuid(1)
	const sessionId = testUuid(50)

	await executeTenantTest({
		query: {
			query: GQL`mutation($id: String!) {
				revokeSession(sessionId: $id) {
					ok
					error { code }
				}
			}`,
			variables: { id: sessionId },
		},
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, password: '123', roles: [], email: 'john@doe.com' },
			}),
			getApiKeySql({
				apiKeyId: sessionId,
				response: { personId, identityId: authenticatedIdentityId, apiKeyType: ApiKey.Type.SESSION },
			}),
			disableApiKey({ id: sessionId }),
		],
		return: {
			data: {
				revokeSession: { ok: true, error: null },
			},
		},
		expectedAuthLog: {
			type: 'session_revoked_by_user',
			personId,
			response: expect.objectContaining({ ok: true }),
			metadata: { sessionId },
		},
	})
})

test('revoke session – not yours returns SESSION_NOT_FOUND', async () => {
	const personId = testUuid(1)
	const sessionId = testUuid(60)
	const someoneElsesIdentity = testUuid(77)

	await executeTenantTest({
		query: {
			query: GQL`mutation($id: String!) {
				revokeSession(sessionId: $id) {
					ok
					error { code }
				}
			}`,
			variables: { id: sessionId },
		},
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, password: '123', roles: [], email: 'john@doe.com' },
			}),
			getApiKeySql({
				apiKeyId: sessionId,
				response: { personId, identityId: someoneElsesIdentity, apiKeyType: ApiKey.Type.SESSION },
			}),
		],
		return: {
			data: {
				revokeSession: { ok: false, error: { code: 'SESSION_NOT_FOUND' } },
			},
		},
		expectedAuthLog: {
			type: 'session_revoked_by_user',
			personId,
			response: expect.objectContaining({ ok: false }),
			metadata: { sessionId },
		},
	})
})

test('revoke session – not a person returns NOT_A_PERSON', async () => {
	const sessionId = testUuid(70)

	await executeTenantTest({
		query: {
			query: GQL`mutation($id: String!) {
				revokeSession(sessionId: $id) {
					ok
					error { code }
				}
			}`,
			variables: { id: sessionId },
		},
		executes: [
			getPersonByIdentity({ identityId: authenticatedIdentityId, response: null }),
		],
		return: {
			data: {
				revokeSession: { ok: false, error: { code: 'NOT_A_PERSON' } },
			},
		},
		expectedAuthLog: {
			type: 'session_revoked_by_user',
			response: expect.objectContaining({ ok: false }),
		},
	})
})
