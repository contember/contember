import 'jasmine'
import { executeTenantTest } from '../../../src/testTenant'
import { GQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { disableApiKey } from './sql/disableApiKeySql'

describe('disableApiKey mutation', () => {
	it('disable api key', async () => {
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
})
