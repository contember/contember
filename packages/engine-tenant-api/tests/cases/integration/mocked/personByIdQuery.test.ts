import { executeTenantTest } from '../../../src/testTenant'
import { GQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { test } from 'vitest'
import { getPersonByIdSql } from './sql/getPersonByIdSql'

test('get person by id query', async () => {
	const name = 'John Doe'
	const email = 'john@doe.com'
	const personId = testUuid(1)
	const identityId = testUuid(2)

	await executeTenantTest({
		query: {
			query: GQL`
query personById($id: String!) {
	personById(id: $id) {
		id
		name
		email
		identity {
			id
		}
	}
}`,
			variables: { id: personId },
		},
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, email, roles: [], password: '123', identityId, name },
			}),
		],
		return: {
			data: {
				personById: {
					id: personId,
					name,
					email,
					identity: {
						id: identityId,
					},
				},
			},
		},
	})
})
