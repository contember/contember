import { describe, expect, test } from 'bun:test'
import { TenantConfigApplier } from '../src/lib/tenant/TenantConfigApplier.js'
import type { RemoteCustomRole, RemoteIdentityProvider, TenantClient } from '../src/lib/tenant/TenantClient.js'
import type { TenantCustomRoleConfig } from '../src/lib/tenant/tenantConfig.js'
import { defineTenantConfig } from '../src/lib/tenant/tenantConfig.js'

const createClientMock = (
	existingIdps: RemoteIdentityProvider[] = [],
	existingCustomRoles: RemoteCustomRole[] = [],
) => {
	const calls: string[] = []
	const client = {
		configure: async () => {
			calls.push('configure')
		},
		listIdentityProviders: async () => existingIdps,
		addIdp: async (slug: string) => {
			calls.push(`addIdp:${slug}`)
		},
		updateIdp: async (slug: string) => {
			calls.push(`updateIdp:${slug}`)
		},
		enableIdp: async (slug: string) => {
			calls.push(`enableIdp:${slug}`)
		},
		disableIdp: async (slug: string) => {
			calls.push(`disableIdp:${slug}`)
		},
		addMailTemplate: async (template: { type: string }) => {
			calls.push(`addMailTemplate:${template.type}`)
		},
		listCustomRoles: async () => existingCustomRoles,
		createCustomRole: async (slug: string, role: TenantCustomRoleConfig) => {
			calls.push(`createCustomRole:${slug}:${role.grants.length}`)
		},
		updateCustomRole: async (slug: string, role: TenantCustomRoleConfig) => {
			calls.push(`updateCustomRole:${slug}:${role.grants.length}`)
		},
	}
	return { client: client as unknown as TenantClient, calls }
}

describe('TenantConfigApplier', () => {
	test('sends configure when global config is present', async () => {
		const { client, calls } = createClientMock()
		await new TenantConfigApplier().apply(client, { config: { password: { minLength: 8 } } })
		expect(calls).toEqual(['configure'])
	})

	test('adds a new identity provider', async () => {
		const { client, calls } = createClientMock([])
		await new TenantConfigApplier().apply(client, {
			identityProviders: { google: { type: 'oidc', configuration: {} } },
		})
		expect(calls).toEqual(['addIdp:google'])
	})

	test('updates an existing identity provider', async () => {
		const { client, calls } = createClientMock([{ slug: 'google', type: 'oidc', disabledAt: null }])
		await new TenantConfigApplier().apply(client, {
			identityProviders: { google: { type: 'oidc', configuration: {} } },
		})
		expect(calls).toEqual(['updateIdp:google'])
	})

	test('disables an enabled provider marked disabled', async () => {
		const { client, calls } = createClientMock([{ slug: 'google', type: 'oidc', disabledAt: null }])
		await new TenantConfigApplier().apply(client, {
			identityProviders: { google: { type: 'oidc', configuration: {}, disabled: true } },
		})
		expect(calls).toEqual(['updateIdp:google', 'disableIdp:google'])
	})

	test('re-enables a disabled provider no longer marked disabled', async () => {
		const { client, calls } = createClientMock([{ slug: 'google', type: 'oidc', disabledAt: '2024-01-01T00:00:00Z' }])
		await new TenantConfigApplier().apply(client, {
			identityProviders: { google: { type: 'oidc', configuration: {} } },
		})
		expect(calls).toEqual(['updateIdp:google', 'enableIdp:google'])
	})

	test('upserts mail templates', async () => {
		const { client, calls } = createClientMock()
		await new TenantConfigApplier().apply(client, {
			mailTemplates: [{ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c' }],
		})
		expect(calls).toEqual(['addMailTemplate:RESET_PASSWORD_REQUEST'])
	})

	test('creates all custom role slugs before applying configured grants', async () => {
		const { client, calls } = createClientMock()
		await new TenantConfigApplier().apply(client, {
			customRoles: {
				support: {
					grants: [{
						permission: 'identity:addGlobalRoles',
						config: {
							roles: { allowed: ['reviewer'] },
							target: {
								globalRoles: { allowed: ['person'] },
								projectMemberships: 'none',
							},
							allowSelf: false,
						},
					}],
				},
				reviewer: {
					grants: [{ permission: 'person:view' }],
				},
			},
		})
		expect(calls).toEqual([
			'createCustomRole:support:0',
			'createCustomRole:reviewer:0',
			'updateCustomRole:support:1',
			'updateCustomRole:reviewer:1',
		])
	})

	test('updates an existing custom role without recreating it', async () => {
		const { client, calls } = createClientMock([], [{ slug: 'support' }])
		await new TenantConfigApplier().apply(client, {
			customRoles: {
				support: {
					description: 'Support team',
					grants: [{ permission: 'person:list' }],
				},
			},
		})
		expect(calls).toEqual(['updateCustomRole:support:1'])
	})

	test('dry run performs no mutations but still reads state', async () => {
		const { client, calls } = createClientMock([])
		await new TenantConfigApplier().apply(client, {
			config: { password: { minLength: 8 } },
			identityProviders: { google: { type: 'oidc', configuration: {} } },
			mailTemplates: [{ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c' }],
			customRoles: {
				support: { grants: [{ permission: 'person:list' }] },
			},
		}, { dryRun: true })
		expect(calls).toEqual([])
	})

	test('accepts every typed custom-role grant configuration kind', () => {
		const config = defineTenantConfig({
			customRoles: {
				support: {
					grants: [
						{ permission: 'person:list' },
						{
							permission: 'person:signUp',
							config: { roles: { allowed: ['person'] } },
						},
						{
							permission: 'person:changePassword',
							config: {
								target: {
									globalRoles: { allowed: ['person'] },
									projectMemberships: 'none',
								},
							},
						},
						{
							permission: 'person:changeProfile',
							config: {
								target: {
									globalRoles: { allowed: ['person'] },
									projectMemberships: 'none',
								},
								fields: { allowed: ['name'] },
							},
						},
						{
							permission: 'person:createSessionToken',
							config: {
								target: {
									globalRoles: { allowed: ['person'] },
									projectMemberships: 'none',
								},
								session: {
									maxExpirationMinutes: 30,
									allowTrustForwardedClientInfo: false,
								},
							},
						},
						{
							permission: 'identity:addGlobalRoles',
							config: {
								roles: { allowed: ['support'] },
								target: {
									globalRoles: { allowed: ['person'] },
									projectMemberships: 'none',
								},
								allowSelf: false,
							},
						},
						{
							permission: 'apiKey:createGlobal',
							config: {
								roles: { allowed: ['support'] },
								allowTrustForwardedClientInfo: false,
							},
						},
						{
							permission: 'mailTemplate:list',
							config: {
								global: false,
								projects: ['example'],
								types: ['FORCED_SIGN_OUT'],
							},
						},
					],
				},
			},
		})
		expect(config.customRoles?.support.grants).toHaveLength(8)
	})
})
