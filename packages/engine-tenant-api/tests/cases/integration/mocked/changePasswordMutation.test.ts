import { executeTenantTest } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { changePasswordMutation } from './gql/changePassword'
import { getPersonByIdSql } from './sql/getPersonByIdSql'
import { updatePersonPasswordSql } from './sql/updatePesonPasswordSql'
import { expect, test } from 'bun:test'
import { getConfigSql } from './sql/getConfigSql'

test('changes a password', async () => {
	const personId = testUuid(1)
	const identityId = testUuid(2)
	const password = 'AbcDeg123'
	await executeTenantTest({
		query: changePasswordMutation({ personId, password }),
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, email: 'john@doe.com', roles: [], password: '123', identityId },
			}),
			getConfigSql(),
			updatePersonPasswordSql({ personId, password }),
		],
		return: {
			data: {
				changePassword: {
					ok: true,
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'password_change',
			response: expect.objectContaining({
				ok: true,
			}),
		}),
	})
})

