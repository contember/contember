import { executeTenantTest } from '../../../src/testTenant.js'
import { GQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { disableApiKey } from './sql/disableApiKeySql.js'
import { test } from 'vitest'

test('disable api key', async () => {
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		query: {
			query: GQL`mutation($apiKeyId: String!) {
					disableApiKey(id: $apiKeyId){
						ok
					}
				}`,
			variables: { apiKeyId },
		},
		executes: [disableApiKey({ id: apiKeyId })],
		return: {
			data: {
				disableApiKey: {
					ok: true,
				},
			},
		},
	})
})
