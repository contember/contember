import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { signInIDP } from './gql/signInIdp.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { getIdpBySlugSql } from './sql/getIdpBySlugSql.js'
import { getPersonByIdpSql } from './sql/getPersonByIdpSql.js'
import { createSessionKeySql } from './sql/createSessionKeySql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { createIdentitySql } from './sql/createIdentitySql.js'
import { createPersonSql } from './sql/createPersonSql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'
import { getAuthPoliciesSql } from './sql/authPolicySql.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { AuthLogService } from '../../../../src/model/service/AuthLogService.js'

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
						initReturnsConfig: false,
						requireVerifiedEmail: false,
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
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
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
		expectedAuthLog: {
			type: 'idp_login',
			response: expect.objectContaining({
				ok: true,
			}),
		},
	})
})

test('does NOT link by e-mail when provider requires a verified e-mail and the claim is unverified', async () => {
	const externalIdentifier = 'abcd'
	const email = 'john@doe.com'
	const identityId = testUuid(2)
	const personId = testUuid(7)
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
						initReturnsConfig: false,
						requireVerifiedEmail: true,
						configuration: {
							externalIdentifier,
							email,
							emailVerified: false,
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				// No IdP identity yet, and the matched-by-email account must NOT be
				// linked because the provider asserts an unverified e-mail.
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: null,
				}),
				getPersonByEmailSql({
					email,
					response: { personId, identityId, password: '123', roles: [] },
				}),
			),
		],
		return: {
			data: {
				signInIDP: {
					ok: false,
					errors: [{ code: 'PERSON_NOT_FOUND' }],
					result: null,
				},
			},
		},
		// The gate block is takeover-grade, so the audit entry must stay
		// distinguishable from an ordinary not-found: it records the blocked
		// account's id and a reason, even though the external error is generic.
		expectedAuthLog: {
			type: 'idp_login',
			response: expect.objectContaining({
				ok: false,
				metadata: expect.objectContaining({
					[AuthLogService.Key]: expect.objectContaining({
						data: expect.objectContaining({
							personId,
							eventData: { reason: 'idp_email_unverified' },
						}),
					}),
				}),
			}),
		},
	})
})

test('links by e-mail when provider requires a verified e-mail and the claim is verified', async () => {
	const externalIdentifier = 'abcd'
	const email = 'john@doe.com'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
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
						initReturnsConfig: false,
						requireVerifiedEmail: true,
						configuration: {
							externalIdentifier,
							email,
							emailVerified: true,
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
				getPersonByEmailSql({
					email,
					response: { personId, identityId, password: '123', roles: [] },
				}),
				{
					sql: `insert into  "tenant"."person_identity_provider" ("id", "identity_provider_id", "person_id", "external_identifier") values  (?, ?, ?, ?)`,
					parameters: [testUuid(1), idpId, personId, externalIdentifier],
					response: { rowCount: 1 },
				},
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({
					apiKeyId: testUuid(2),
					identityId,
				}),
			),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({
				identityId,
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
		expectedAuthLog: {
			type: 'idp_login',
			response: expect.objectContaining({
				ok: true,
			}),
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
						initReturnsConfig: false,
						requireVerifiedEmail: false,
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
				createPersonSql({ personId, identityId, name: 'john', idpOnly: true }),
				{
					sql: `insert into  "tenant"."person_identity_provider" ("id", "identity_provider_id", "person_id", "external_identifier") values  (?, ?, ?, ?)`,
					parameters: [testUuid(3), idpId, personId, externalIdentifier],
					response: { rowCount: 1 },
				},
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
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
		expectedAuthLog: {
			type: 'idp_login',
			response: expect.objectContaining({
				ok: true,
			}),
		},
	})
})
