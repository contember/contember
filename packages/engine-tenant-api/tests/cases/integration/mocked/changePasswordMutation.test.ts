import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { changePasswordMutation } from './gql/changePassword.js'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'
import { updatePersonPasswordSql } from './sql/updatePesonPasswordSql.js'
import { expect, test } from 'bun:test'
import { getConfigSql } from './sql/getConfigSql.js'
import { getIdentityProjectMembershipPresenceSql } from './sql/getIdentityProjectMembershipPresenceSql.js'
import { sqlReadCommittedTransaction } from './sql/sqlTransaction.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'

test('changes a password', async () => {
	const personId = testUuid(1)
	const identityId = testUuid(2)
	const password = 'AbcDeg123'
	await executeTenantTest({
		query: changePasswordMutation({ personId, password }),
		executes: [
			...sqlReadCommittedTransaction(
				getPersonByIdSql({
					personId,
					response: { personId, email: 'john@doe.com', roles: [], password: '123', identityId },
				}),
				getIdentityByIdSql({ identityId, lock: true }),
				getIdentityProjectMembershipPresenceSql(identityId),
				getConfigSql(),
				updatePersonPasswordSql({ personId, password }),
			),
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
