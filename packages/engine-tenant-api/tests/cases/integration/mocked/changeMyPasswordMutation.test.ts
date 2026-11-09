import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { updatePersonPasswordSql } from './sql/updatePesonPasswordSql.js'
import { test } from 'bun:test'
import { changeMyPasswordMutation } from './gql/changeMyPassword.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { authenticatedApiKeyId, authenticatedIdentityId } from '../../../src/testTenant.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { SQL } from '../../../src/tags.js'
import { getConfigSql } from './sql/getConfigSql.js'

test('changes my password', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const currentPassword = '123456'
	const newPassword = 'ABcc123456'
	await executeTenantTest({
		query: changeMyPasswordMutation({ currentPassword, newPassword }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john@doe.com', roles: [], password: '123456' },
			}),
			getConfigSql(),
			updatePersonPasswordSql({ personId, password: newPassword }),
		],
		return: {
			data: {
				changeMyPassword: {
					ok: true,
					error: null,
				},
			},
		},
		expectedAuthLog: { 'type': 'password_change', 'response': { 'result': null, 'ok': true }, 'personId': testUuid(1) },
	})
})

test('changes my password - weak', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const currentPassword = '123456'
	const newPassword = 'abcd123'
	await executeTenantTest({
		query: changeMyPasswordMutation({ currentPassword, newPassword }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john@doe.com', roles: [], password: '123456' },
			}),
			getConfigSql(),
		],
		return: {
			data: {
				changeMyPassword: {
					ok: false,
					error: {
						code: 'TOO_WEAK',
					},
				},
			},
		},
		expectedAuthLog: {
			'type': 'password_change',
			'response': {
				ok: false,
				error: 'TOO_WEAK',
				errorMessage: 'Password must contain at least 1 uppercase letter. Password is blacklisted.',
				metadata: {
					weakPasswordReasons: [
						'MISSING_UPPERCASE',
						'BLACKLISTED',
					],
				},
			},
			'personId': testUuid(1),
		},
	})
})

test('changes my password - invalid current password', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const currentPassword = 'xxxxxx'
	const newPassword = 'ABcc123456'
	await executeTenantTest({
		query: changeMyPasswordMutation({ currentPassword, newPassword }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john@doe.com', roles: [], password: '123456' },
			}),
			getConfigSql(),
		],
		return: {
			data: {
				changeMyPassword: {
					ok: false,
					error: {
						code: 'INVALID_PASSWORD',
					},
				},
			},
		},
		expectedAuthLog: {
			'type': 'password_change',
			'response': { 'ok': false, 'error': 'INVALID_PASSWORD', 'errorMessage': 'Password does not match' },
			'personId': testUuid(1),
		},
	})
})

test('changes my password and revokes my other sessions when configured', async () => {
	const personId = testUuid(1)
	const newPassword = 'ABcc123456'
	await executeTenantTest({
		query: changeMyPasswordMutation({ currentPassword: '123456', newPassword }),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, email: 'john@doe.com', roles: [], password: '123456' },
			}),
			getConfigSql({ password_revoke_sessions_on_change: true }),
			...sqlTransaction(
				updatePersonPasswordSql({ personId, password: newPassword }),
				{
					sql: SQL`update "tenant"."api_key" set "disabled_at" = now()
						where "identity_id" in (select "identity_id" from "tenant"."person" where "id" = ?)
						and "type" = ? and "disabled_at" is null and "id" != ?`,
					parameters: [personId, 'session', authenticatedApiKeyId],
					response: { rowCount: 2 },
				},
				{
					sql: SQL`update "tenant"."person_token" set "used_at" = now() where "person_id" = ? and "used_at" is null`,
					parameters: [personId],
					response: { rowCount: 1 },
				},
			),
		],
		return: { data: { changeMyPassword: { ok: true, error: null } } },
		expectedAuthLog: { 'type': 'password_change', 'response': { 'result': null, 'ok': true }, 'personId': personId },
	})
})
