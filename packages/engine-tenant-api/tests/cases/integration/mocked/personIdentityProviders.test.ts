import { authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { disconnectMyIdentityProviderMutation, myIdentityProvidersQuery } from './gql/myIdentityProviders.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { disconnectPersonIdentityProviderSql, getPersonByIdentityForIdp, getPersonIdentityProvidersSql } from './sql/personIdentityProvidersSql.js'

const createdAt = new Date('2020-01-01T10:00:00.000Z')

test('lists my identity providers', async () => {
	const personId = testUuid(1)
	const connectionId = testUuid(2)
	await executeTenantTest({
		query: myIdentityProvidersQuery(),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, email: 'john@doe.com', name: 'John', roles: [], password: '123' },
			}),
			getPersonIdentityProvidersSql({
				personId,
				response: [
					{ id: connectionId, createdAt, externalIdentifier: 'ext-1', slug: 'google', type: 'oidc', disabledAt: null },
				],
			}),
		],
		return: {
			data: {
				myIdentityProviders: [
					{
						id: connectionId,
						createdAt: createdAt.toISOString(),
						externalIdentifier: 'ext-1',
						identityProvider: {
							slug: 'google',
							type: 'oidc',
							disabledAt: null,
						},
					},
				],
			},
		},
	})
})

test('returns empty list when the caller is not a person', async () => {
	await executeTenantTest({
		query: myIdentityProvidersQuery(),
		executes: [
			getPersonByIdentity({ identityId: authenticatedIdentityId, response: null }),
		],
		return: {
			data: {
				myIdentityProviders: [],
			},
		},
	})
})

test('disconnects my identity provider when other auth methods remain', async () => {
	const personId = testUuid(1)
	const connectionId = testUuid(2)
	await executeTenantTest({
		query: disconnectMyIdentityProviderMutation({ identityProvider: 'google' }),
		executes: [
			// password set -> not at risk of lock-out
			getPersonByIdentityForIdp({ identityId: authenticatedIdentityId, personId, passwordHash: 'BCRYPTED-123' }),
			...sqlTransaction(
				getPersonIdentityProvidersSql({
					personId,
					response: [
						{ id: connectionId, createdAt, externalIdentifier: 'ext-1', slug: 'google', type: 'oidc' },
					],
				}),
				disconnectPersonIdentityProviderSql({ personId, personIdentityProviderId: connectionId }),
			),
		],
		return: {
			data: {
				disconnectMyIdentityProvider: {
					ok: true,
					error: null,
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'idp_disconnect',
			personId,
			eventData: { slug: 'google' },
			response: expect.objectContaining({ ok: true }),
		}),
	})
})

test('refuses to disconnect the only remaining sign-in method', async () => {
	const personId = testUuid(1)
	const connectionId = testUuid(2)
	await executeTenantTest({
		query: disconnectMyIdentityProviderMutation({ identityProvider: 'google' }),
		executes: [
			// no password and no passwordless -> a single idp connection is the only sign-in method
			getPersonByIdentityForIdp({ identityId: authenticatedIdentityId, personId, passwordHash: null }),
			...sqlTransaction(
				getPersonIdentityProvidersSql({
					personId,
					response: [
						{ id: connectionId, createdAt, externalIdentifier: 'ext-1', slug: 'google', type: 'oidc' },
					],
				}),
			),
		],
		return: {
			data: {
				disconnectMyIdentityProvider: {
					ok: false,
					error: {
						code: 'LAST_AUTH_METHOD',
					},
				},
			},
		},
	})
})

test('returns NOT_FOUND when the person is not connected to the provider', async () => {
	const personId = testUuid(1)
	await executeTenantTest({
		query: disconnectMyIdentityProviderMutation({ identityProvider: 'github' }),
		executes: [
			getPersonByIdentityForIdp({ identityId: authenticatedIdentityId, personId, passwordHash: 'BCRYPTED-123' }),
			...sqlTransaction(
				getPersonIdentityProvidersSql({
					personId,
					response: [
						{ id: testUuid(2), createdAt, externalIdentifier: 'ext-1', slug: 'google', type: 'oidc' },
					],
				}),
			),
		],
		return: {
			data: {
				disconnectMyIdentityProvider: {
					ok: false,
					error: {
						code: 'NOT_FOUND',
					},
				},
			},
		},
	})
})
