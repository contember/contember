import { authenticatedIdentityId, executeTenantTest, now } from '../../../src/testTenant.js'
import { GQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { authLogFilteredSql, authLogPlainSql } from './sql/authLogSql.js'
import { test } from 'bun:test'

test('authLog returns paginated audit entries with default limit', async () => {
	await executeTenantTest({
		query: GQL`query {
			authLog(limit: 2) {
				hasMore
				entries {
					id
					type
					success
					targetPersonId
					invokedByIdentityId
					eventData
					metadata
				}
			}
		}`,
		executes: [
			authLogPlainSql({
				limit: 2,
				offset: 0,
				rows: [
					{
						id: testUuid(1),
						created_at: now,
						type: 'global_role_grant',
						success: true,
						invoked_by_id: authenticatedIdentityId,
						person_id: testUuid(10),
						target_person_id: testUuid(20),
						person_input_identifier: null,
						error_code: null,
						error_message: null,
						ip_address: '10.0.0.1',
						user_agent: 'cli/1.0',
						identity_provider_id: null,
						metadata: { forwarderIp: '203.0.113.7' },
						event_data: { before: { roles: [] }, after: { roles: ['admin'] } },
					},
					{
						id: testUuid(2),
						created_at: new Date('2019-09-04 11:00'),
						type: 'login',
						success: false,
						invoked_by_id: null,
						person_id: null,
						target_person_id: null,
						person_input_identifier: 'attacker@example.com',
						error_code: 'INVALID_PASSWORD',
						error_message: null,
						ip_address: '198.51.100.1',
						user_agent: 'browser',
						identity_provider_id: null,
						metadata: {},
						event_data: null,
					},
					// Sentinel row — present only because the resolver asks for limit+1
					// to detect a further page; should be stripped from the response.
					{
						id: testUuid(3),
						created_at: new Date('2019-09-04 10:00'),
						type: 'login',
						success: true,
						invoked_by_id: testUuid(50),
						person_id: testUuid(10),
						target_person_id: null,
						person_input_identifier: null,
						error_code: null,
						error_message: null,
						ip_address: '198.51.100.2',
						user_agent: 'browser',
						identity_provider_id: null,
						metadata: {},
						event_data: null,
					},
				],
			}),
		],
		return: {
			data: {
				authLog: {
					hasMore: true,
					entries: [
						{
							id: testUuid(1),
							type: 'global_role_grant',
							success: true,
							targetPersonId: testUuid(20),
							invokedByIdentityId: authenticatedIdentityId,
							eventData: { before: { roles: [] }, after: { roles: ['admin'] } },
							metadata: { forwarderIp: '203.0.113.7' },
						},
						{
							id: testUuid(2),
							type: 'login',
							success: false,
							targetPersonId: null,
							invokedByIdentityId: null,
							eventData: null,
							metadata: {},
						},
					],
				},
			},
		},
	})
})

test('authLog applies type and targetPersonId filters', async () => {
	const target = testUuid(42)
	await executeTenantTest({
		query: {
			query: GQL`query ($target: String!) {
				authLog(
					limit: 10,
					filter: { types: ["global_role_grant", "global_role_revoke"], targetPersonId: $target }
				) {
					hasMore
					entries { id type }
				}
			}`,
			variables: { target },
		},
		executes: [
			authLogFilteredSql({
				types: ['global_role_grant', 'global_role_revoke'],
				targetPersonId: target,
				limit: 10,
				offset: 0,
				rows: [
					{
						id: testUuid(1),
						created_at: now,
						type: 'global_role_revoke',
						success: true,
						invoked_by_id: authenticatedIdentityId,
						person_id: null,
						target_person_id: target,
						person_input_identifier: null,
						error_code: null,
						error_message: null,
						ip_address: null,
						user_agent: null,
						identity_provider_id: null,
						metadata: {},
						event_data: { before: { roles: ['admin'] }, after: { roles: [] } },
					},
				],
			}),
		],
		return: {
			data: {
				authLog: {
					hasMore: false,
					entries: [
						{ id: testUuid(1), type: 'global_role_revoke' },
					],
				},
			},
		},
	})
})
