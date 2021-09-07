import { executeTenantTest } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { updatePersonPasswordSql } from './sql/updatePesonPasswordSql'
import { test } from 'uvu'
import { changeMyPasswordMutation } from './gql/changeMyPassword'
import { getPersonByIdentity } from './sql/getPersonByIdentity'
import { authenticatedIdentityId } from '../../../src/testTenantDb'

test('changes my password', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const currentPassword = '123456'
	const newPassword = 'abcd123'
	await executeTenantTest({
		query: changeMyPasswordMutation({ currentPassword, newPassword }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john@doe.com', roles: [], password: '123456' },
			}),
			updatePersonPasswordSql({ personId, password: newPassword }),
		],
		return: {
			data: {
				changeMyPassword: {
					ok: true,
					error: null,
				},
			},
		},
	})
})


test('changes my password - invalid current password', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const currentPassword = 'xxxxxx'
	const newPassword = 'abcd123'
	await executeTenantTest({
		query: changeMyPasswordMutation({ currentPassword, newPassword }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john@doe.com', roles: [], password: '123456' },
			}),
		],
		return: {
			data: {
				changeMyPassword: {
					ok: false,
					error: {
						code: 'INVALID_PASSWORD',
					},
				},
			},
		},
	})
})

test.run()
