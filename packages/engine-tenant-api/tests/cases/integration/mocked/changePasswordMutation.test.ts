import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { changePasswordMutation } from './gql/changePassword.js'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'
import { updatePersonPasswordSql } from './sql/updatePesonPasswordSql.js'
import { expect, test } from 'bun:test'
import { getConfigSql } from './sql/getConfigSql.js'
import { getIdentityProjectMembershipPresenceSql } from './sql/getIdentityProjectMembershipPresenceSql.js'

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
			getIdentityProjectMembershipPresenceSql(identityId),
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

test('treats a global project admin as having project memberships', async () => {
	const personId = testUuid(1)
	const identityId = testUuid(2)
	const password = 'AbcDeg123'
	await executeTenantTest({
		query: changePasswordMutation({ personId, password }),
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, email: 'john@doe.com', roles: ['project_admin'], password: '123', identityId },
			}),
			getConfigSql(),
			updatePersonPasswordSql({ personId, password }),
		],
		authorizator: {
			isAllowed: (_identity, _scope, action) => {
				const target = action.meta?.target
				return Promise.resolve(
					typeof target === 'object'
						&& target !== null
						&& 'hasProjectMemberships' in target
						&& target.hasProjectMemberships === true,
				)
			},
		},
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
