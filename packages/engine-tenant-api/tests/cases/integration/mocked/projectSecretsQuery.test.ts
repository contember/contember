import { executeTenantTest } from '../../../src/testTenant.js'
import { GQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { test } from 'bun:test'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'
import { listProjectSecretsSql } from './sql/listProjectSecretsSql.js'

test('project.secrets lists secret keys without values', async () => {
	const projectId = testUuid(1)
	const createdAt = new Date('2019-09-01 10:00')
	const updatedAt = new Date('2019-09-02 10:00')

	await executeTenantTest({
		query: {
			query: GQL`
query {
	projectBySlug(slug: "sandbox") {
		secrets {
			key
			createdAt
			updatedAt
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
			listProjectSecretsSql({
				projectId,
				rows: [
					{ key: 'API_TOKEN', createdAt, updatedAt },
					{ key: 'WEBHOOK_SECRET', createdAt, updatedAt },
				],
			}),
		],
		return: {
			data: {
				projectBySlug: {
					secrets: [
						{ key: 'API_TOKEN', createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() },
						{ key: 'WEBHOOK_SECRET', createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() },
					],
				},
			},
		},
	})
})

test('project.secrets returns empty (no secrets query) for a caller without project:viewSecrets', async () => {
	const projectId = testUuid(1)

	await executeTenantTest({
		query: {
			query: GQL`
query {
	projectBySlug(slug: "sandbox") {
		secrets {
			key
		}
	}
}`,
			variables: {},
		},
		// Allows project:view (so projectBySlug resolves) but denies project:viewSecrets.
		authorizator: {
			isAllowed: async (identity, scope, action) => action.resource === 'project' && action.privilege === 'view',
		},
		executes: [
			getProjectBySlugSql({
				projectSlug: 'sandbox',
				response: { id: projectId, name: 'sandbox', slug: 'sandbox', config: {} },
			}),
		],
		return: {
			data: {
				projectBySlug: {
					secrets: [],
				},
			},
		},
	})
})
