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
import { sqlReadCommittedTransaction } from './sql/sqlTransaction.js'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'

test('create session key', async () => {
	const email = 'john@doe.com'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		query: createSessionTokenMutation({ email }, { withData: true }),
		executes: [
			...sqlReadCommittedTransaction(
				getPersonByEmailSql({ email, response: { personId, identityId, password: 'aaa', roles: [] } }),
				getIdentityByIdSql({ identityId, lock: true }),
				getIdentityProjectMembershipPresenceSql(identityId),
				getPersonByIdSql({
					personId,
					response: { personId, identityId, password: 'aaa', roles: [], email },
				}),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId: apiKeyId, identityId: identityId }),
			),
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

test('create session key rechecks disabled state after locking the target identity', async () => {
	const email = 'john@doe.com'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	await executeTenantTest({
		query: createSessionTokenMutation({ email }),
		executes: [
			...sqlReadCommittedTransaction(
				getPersonByEmailSql({ email, response: { personId, identityId, password: 'aaa', roles: [] } }),
				getIdentityByIdSql({ identityId, lock: true }),
				getIdentityProjectMembershipPresenceSql(identityId),
				getPersonByIdSql({
					personId,
					response: { personId, identityId, password: 'aaa', roles: [], email, disabledAt: new Date() },
				}),
			),
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
