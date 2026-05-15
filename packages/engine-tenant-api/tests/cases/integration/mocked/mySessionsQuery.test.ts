import { authenticatedApiKeyId, authenticatedIdentityId, executeTenantTest, now } from '../../../src/testTenant'
import { GQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { listSessionsSql } from './sql/listSessionsSql'
import { test } from 'bun:test'

test('me.sessions returns active sessions and marks the current one', async () => {
	const currentSession = authenticatedApiKeyId
	const otherSession = testUuid(101)

	await executeTenantTest({
		query: GQL`query {
			me {
				sessions {
					id
					isCurrent
					lastIp
					lastUserAgent
					createdIp
					createdUserAgent
				}
			}
		}`,
		executes: [
			listSessionsSql({
				identityId: authenticatedIdentityId,
				now,
				rows: [
					{
						id: currentSession,
						created_at: now,
						expires_at: null,
						last_used_at: now,
						last_ip: '10.0.0.1',
						last_user_agent: 'cli/1.0',
						created_ip: '10.0.0.1',
						created_user_agent: 'cli/1.0',
					},
					{
						id: otherSession,
						created_at: new Date('2019-09-04 10:00'),
						expires_at: null,
						last_used_at: new Date('2019-09-04 11:00'),
						last_ip: '203.0.113.7',
						last_user_agent: 'browser',
						created_ip: '203.0.113.7',
						created_user_agent: 'browser',
					},
				],
			}),
		],
		return: {
			data: {
				me: {
					sessions: [
						{
							id: currentSession,
							isCurrent: true,
							lastIp: '10.0.0.1',
							lastUserAgent: 'cli/1.0',
							createdIp: '10.0.0.1',
							createdUserAgent: 'cli/1.0',
						},
						{
							id: otherSession,
							isCurrent: false,
							lastIp: '203.0.113.7',
							lastUserAgent: 'browser',
							createdIp: '203.0.113.7',
							createdUserAgent: 'browser',
						},
					],
				},
			},
		},
	})
})
