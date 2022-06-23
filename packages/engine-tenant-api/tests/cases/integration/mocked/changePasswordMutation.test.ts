import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { changePasswordMutation } from './gql/changePassword.js'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'
import { updatePersonPasswordSql } from './sql/updatePesonPasswordSql.js'
import { test } from 'vitest'

test('changes a password', async () => {
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

