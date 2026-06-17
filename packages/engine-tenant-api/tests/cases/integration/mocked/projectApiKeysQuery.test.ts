import { executeTenantTest, now } from '../../../src/testTenant.js'
import { GQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { test } from 'bun:test'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'
import { projectApiKeysSql } from './sql/listApiKeysSql.js'

test('project.apiKeys lists permanent project api keys', async () => {
	const projectId = testUuid(1)
	const apiKeyId = testUuid(10)
	const identityId = testUuid(11)

	await executeTenantTest({
		query: {
			query: GQL`
query {
	projectBySlug(slug: "sandbox") {
		apiKeys {
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
	}
}`,
			variables: {},
		},
		executes: [
			getProjectBySlugSql({
				projectSlug: 'sandbox',
				response: { id: projectId, name: 'sandbox', slug: 'sandbox', config: {} },
			}),
			projectApiKeysSql({
				projectId,
				rows: [
					{ id: apiKeyId, identityId, description: 'CI token', createdAt: now, disabledAt: null },
				],
			}),
		],
		return: {
			data: {
				projectBySlug: {
					apiKeys: [
						{
							id: apiKeyId,
							description: 'CI token',
							type: 'PERMANENT',
							enabled: true,
							createdAt: now.toISOString(),
							lastUsedAt: null,
							expiresAt: null,
							identity: { id: identityId },
						},
					],
				},
			},
		},
	})
})

test('project.apiKeys reports enabled=false for disabled key', async () => {
	const projectId = testUuid(1)
	const apiKeyId = testUuid(10)
	const identityId = testUuid(11)

	await executeTenantTest({
		query: {
			query: GQL`
query {
	projectBySlug(slug: "sandbox") {
		apiKeys {
			id
			enabled
		}
	}
}`,
			variables: {},
		},
		executes: [
			getProjectBySlugSql({
				projectSlug: 'sandbox',
				response: { id: projectId, name: 'sandbox', slug: 'sandbox', config: {} },
			}),
			projectApiKeysSql({
				projectId,
				rows: [
					{ id: apiKeyId, identityId, createdAt: now, disabledAt: now },
				],
			}),
		],
		return: {
			data: {
				projectBySlug: {
					apiKeys: [
						{ id: apiKeyId, enabled: false },
					],
				},
			},
		},
	})
})
