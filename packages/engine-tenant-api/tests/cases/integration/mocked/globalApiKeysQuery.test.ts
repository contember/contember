import { executeTenantTest, now } from '../../../src/testTenant.js'
import { GQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { test } from 'bun:test'
import { globalApiKeysSql } from './sql/listApiKeysSql.js'

test('globalApiKeys lists permanent keys with no project membership', async () => {
	const apiKeyId = testUuid(10)
	const identityId = testUuid(11)
	const expiresAt = new Date('2030-01-01 00:00')
	const lastUsedAt = new Date('2019-09-01 00:00')

	await executeTenantTest({
		query: {
			query: GQL`
query {
	globalApiKeys {
		id
		description
		type
		enabled
		createdAt
		lastUsedAt
		expiresAt
		identity {
			id
		}
	}
}`,
			variables: {},
		},
		executes: [
			globalApiKeysSql({
				rows: [
					{ id: apiKeyId, identityId, description: 'global token', createdAt: now, lastUsedAt, expiresAt, disabledAt: null },
				],
			}),
		],
		return: {
			data: {
				globalApiKeys: [
					{
						id: apiKeyId,
						description: 'global token',
						type: 'PERMANENT',
						enabled: true,
						createdAt: now.toISOString(),
						lastUsedAt: lastUsedAt.toISOString(),
						expiresAt: expiresAt.toISOString(),
						identity: { id: identityId },
					},
				],
			},
		},
	})
})

test('globalApiKeys returns empty (no query) for a caller without apiKey:list', async () => {
	await executeTenantTest({
		query: {
			query: GQL`
query {
	globalApiKeys {
		id
	}
}`,
			variables: {},
		},
		authorizator: {
			isAllowed: async () => false,
		},
		executes: [],
		return: {
			data: {
				globalApiKeys: [],
			},
		},
	})
})
