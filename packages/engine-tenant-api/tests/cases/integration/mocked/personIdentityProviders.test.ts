import { authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { disconnectMyIdentityProviderMutation, myIdentityProvidersQuery } from './gql/myIdentityProviders.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { disconnectPersonIdentityProviderSql, getPersonByIdentityForIdp, getPersonIdentityProvidersSql } from './sql/personIdentityProvidersSql.js'
import { getConfigSql } from './sql/getConfigSql.js'

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

test('disconnects my identity provider when a password remains', async () => {
	const personId = testUuid(1)
	const connectionId = testUuid(2)
	await executeTenantTest({
		query: disconnectMyIdentityProviderMutation({ id: connectionId }),
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
				getConfigSql(),
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
			eventData: { id: connectionId, slug: 'google' },
			response: expect.objectContaining({ ok: true }),
		}),
	})
})

test('disconnects my identity provider when another usable connection remains', async () => {
	const personId = testUuid(1)
	const googleConnectionId = testUuid(2)
	const githubConnectionId = testUuid(3)
	await executeTenantTest({
		query: disconnectMyIdentityProviderMutation({ id: googleConnectionId }),
		executes: [
			// no password, no passwordless -> the second (still enabled) connection is what keeps the person out of lock-out
			getPersonByIdentityForIdp({ identityId: authenticatedIdentityId, personId, passwordHash: null }),
			...sqlTransaction(
				getPersonIdentityProvidersSql({
					personId,
					response: [
						{ id: googleConnectionId, createdAt, externalIdentifier: 'ext-1', slug: 'google', type: 'oidc' },
						{ id: githubConnectionId, createdAt, externalIdentifier: 'ext-2', slug: 'github', type: 'oidc' },
					],
				}),
				getConfigSql(),
				disconnectPersonIdentityProviderSql({ personId, personIdentityProviderId: googleConnectionId }),
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
			eventData: { id: googleConnectionId, slug: 'google' },
			response: expect.objectContaining({ ok: true }),
		}),
	})
})

test('disconnects my identity provider when passwordless sign-in remains enabled', async () => {
	const personId = testUuid(1)
	const connectionId = testUuid(2)
	await executeTenantTest({
		query: disconnectMyIdentityProviderMutation({ id: connectionId }),
		executes: [
			// no password, but passwordless is enabled for the person and the policy allows opt-in
			getPersonByIdentityForIdp({ identityId: authenticatedIdentityId, personId, passwordHash: null, passwordlessEnabled: true }),
			...sqlTransaction(
				getPersonIdentityProvidersSql({
					personId,
					response: [
						{ id: connectionId, createdAt, externalIdentifier: 'ext-1', slug: 'google', type: 'oidc' },
					],
				}),
				getConfigSql({ passwordless_enabled: 'optIn' }),
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
			eventData: { id: connectionId, slug: 'google' },
			response: expect.objectContaining({ ok: true }),
		}),
	})
})

test('refuses to disconnect the only remaining sign-in method', async () => {
	const personId = testUuid(1)
	const connectionId = testUuid(2)
	await executeTenantTest({
		query: disconnectMyIdentityProviderMutation({ id: connectionId }),
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
				getConfigSql(),
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

test('refuses to disconnect when passwordless is enabled for the person but disabled by tenant policy', async () => {
	const personId = testUuid(1)
	const connectionId = testUuid(2)
	await executeTenantTest({
		query: disconnectMyIdentityProviderMutation({ id: connectionId }),
		executes: [
			// the person flag says passwordless is on, but the tenant policy is `never` -> they cannot actually sign in passwordless
			getPersonByIdentityForIdp({ identityId: authenticatedIdentityId, personId, passwordHash: null, passwordlessEnabled: true }),
			...sqlTransaction(
				getPersonIdentityProvidersSql({
					personId,
					response: [
						{ id: connectionId, createdAt, externalIdentifier: 'ext-1', slug: 'google', type: 'oidc' },
					],
				}),
				getConfigSql({ passwordless_enabled: 'never' }),
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

test('refuses to disconnect when the only other connection is to a disabled provider', async () => {
	const personId = testUuid(1)
	const googleConnectionId = testUuid(2)
	const disabledConnectionId = testUuid(3)
	await executeTenantTest({
		query: disconnectMyIdentityProviderMutation({ id: googleConnectionId }),
		executes: [
			// no password, no passwordless; the second connection belongs to a disabled provider and cannot sign in
			getPersonByIdentityForIdp({ identityId: authenticatedIdentityId, personId, passwordHash: null }),
			...sqlTransaction(
				getPersonIdentityProvidersSql({
					personId,
					response: [
						{ id: googleConnectionId, createdAt, externalIdentifier: 'ext-1', slug: 'google', type: 'oidc', disabledAt: null },
						{
							id: disabledConnectionId,
							createdAt,
							externalIdentifier: 'ext-2',
							slug: 'github',
							type: 'oidc',
							disabledAt: new Date('2021-01-01T00:00:00.000Z'),
						},
					],
				}),
				getConfigSql(),
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

test('returns NOT_FOUND when the person is not connected to the given connection', async () => {
	const personId = testUuid(1)
	await executeTenantTest({
		query: disconnectMyIdentityProviderMutation({ id: testUuid(99) }),
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

test('returns NOT_A_PERSON when the caller is not a person', async () => {
	await executeTenantTest({
		// the identity is not a person (e.g. an api key) -> short-circuit before opening a transaction
		query: disconnectMyIdentityProviderMutation({ id: testUuid(2) }),
		executes: [
			getPersonByIdentity({ identityId: authenticatedIdentityId, response: null }),
		],
		return: {
			data: {
				disconnectMyIdentityProvider: {
					ok: false,
					error: {
						code: 'NOT_A_PERSON',
					},
				},
			},
		},
	})
})
