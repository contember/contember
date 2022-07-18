import { executeTenantTest } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { test } from 'vitest'
import { signInIDP } from './gql/signInIdp'
import { sqlTransaction } from './sql/sqlTransaction'
import { getIdpBySlugSql } from './sql/getIdpBySlugSql'
import { getPersonByIdpSql } from './sql/getPersonByIdpSql'
import { createSessionKeySql } from './sql/createSessionKeySql'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql'
import { selectMembershipsSql } from './sql/selectMembershipsSql'
import { createIdentitySql } from './sql/createIdentitySql'
import { createPersonSql } from './sql/createPersonSql'

test('signs in idp with existing identity', async () => {
	const externalIdentifier = 'abcd'
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	const idpId = testUuid(20)
	await executeTenantTest({
		query: signInIDP({
			identityProvider: 'mock',
			idpResponse: {
				url: 'test',
			},
			redirectUrl: 'test',
			sessionData: {},
		}),
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						configuration: {
							externalIdentifier: externalIdentifier,
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier: externalIdentifier,
					identityProviderId: idpId,
					response: {
						email,
						password,
						identityId,
						personId,
						roles: [],
					},
				}),
				createSessionKeySql({
					apiKeyId,
					identityId,
				}),
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
				signInIDP: {
					ok: true,
					errors: [],
					result: {
						token: '0000000000000000000000000000000000000000',
					},
				},
			},
		},
	})
})


test('signs in exclusive idp', async () => {
	const externalIdentifier = 'abcd'
	const email = 'john@doe.com'
	const identityId = testUuid(1)
	const personId = testUuid(2)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(4)
	const idpId = testUuid(20)
	await executeTenantTest({
		query: signInIDP({
			identityProvider: 'mock',
			idpResponse: {
				url: 'test',
			},
			redirectUrl: 'test',
			sessionData: {},
		}),
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: true,
						exclusive: true,
						configuration: {
							externalIdentifier: externalIdentifier,
							email,
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: null,
				}),
				createIdentitySql({ identityId, roles: ['person'] }),
				createPersonSql({ personId, identityId, name: email, idpOnly: true }),
				{
					sql: `insert into  "tenant"."person_identity_provider" ("id", "identity_provider_id", "person_id", "external_identifier") values  (?, ?, ?, ?)`,
					parameters: [testUuid(3), idpId, personId, externalIdentifier],
					response: { rowCount: 1 },
				},
				createSessionKeySql({
					apiKeyId,
					identityId,
				}),
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
				signInIDP: {
					ok: true,
					errors: [],
					result: {
						token: '0000000000000000000000000000000000000000',
					},
				},
			},
		},
	})
})
