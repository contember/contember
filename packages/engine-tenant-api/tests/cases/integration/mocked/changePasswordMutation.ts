import { executeTenantTest } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { changePasswordMutation } from './gql/changePassword'
import { getPersonByIdSql } from './sql/getPersonByIdSql'
import { updatePersonPasswordSql } from './sql/updatePesonPasswordSql'

describe('change password mutation', () => {
	it('changes a password', async () => {
		const personId = testUuid(1)
		const identityId = testUuid(2)
		const password = '123456'
		await executeTenantTest({
			query: changePasswordMutation({ personId, password }),
			executes: [
				getPersonByIdSql({
					personId,
					response: { personId, email: 'john@doe.com', roles: [], password: '123', identityId },
				}),
				updatePersonPasswordSql({ personId, password }),
			],
			return: {
				data: {
					changePassword: {
						ok: true,
					},
				},
			},
		})
	})
})
