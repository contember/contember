import { executeTenantTest } from '../../../src/testTenant.js'
import { SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { expect, test } from 'bun:test'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { createSessionTokenMutation } from './gql/createSessionToken.js'
import { createSessionKeySql } from './sql/createSessionKeySql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'
import { getAuthPoliciesSql } from './sql/authPolicySql.js'
import { getIdentityProjectMembershipPresenceSql } from './sql/getIdentityProjectMembershipPresenceSql.js'

test('create session key', async () => {
	const email = 'john@doe.com'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		query: createSessionTokenMutation({ email }, { withData: true }),
		executes: [
			getPersonByEmailSql({ email, response: { personId, identityId, password: 'aaa', roles: [] } }),
			getIdentityProjectMembershipPresenceSql(identityId),
			getConfigSql(),
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId: apiKeyId, identityId: identityId }),
			getIdentityProjectsSql({ identityId: identityId, projectId: projectId }),
			selectMembershipsSql({
				identityId: identityId,
				projectId,
				membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }],
			}),
		],
		return: {
			data: {
				createSessionToken: {
					ok: true,
					error: null,
					result: {
						person: {
							id: personId,
							identity: {
								projects: [
									{
										project: {
											slug: 'foo',
										},
										memberships: [
											{
												role: 'editor',
											},
										],
									},
								],
							},
						},
						token: '0000000000000000000000000000000000000000',
					},
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'create_session_token',
			response: expect.objectContaining({
				ok: true,
			}),
		}),
	})
})

test('create session key is refused for a disabled person', async () => {
	const email = 'john@doe.com'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	await executeTenantTest({
		query: createSessionTokenMutation({ email }),
		executes: [
			getPersonByEmailSql({
				email,
				response: { personId, identityId, password: 'aaa', roles: [], disabledAt: new Date() },
			}),
		],
		return: {
			data: {
				createSessionToken: {
					ok: false,
					error: { code: 'PERSON_DISABLED' },
					result: null,
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'create_session_token',
			response: expect.objectContaining({
				ok: false,
				error: 'PERSON_DISABLED',
			}),
		}),
	})
})
