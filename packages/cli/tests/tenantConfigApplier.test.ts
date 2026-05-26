import { describe, expect, test } from 'bun:test'
import { TenantConfigApplier } from '../src/lib/tenant/TenantConfigApplier'
import type { RemoteIdentityProvider, TenantClient } from '../src/lib/tenant/TenantClient'

const createClientMock = (existingIdps: RemoteIdentityProvider[] = []) => {
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

	test('dry run performs no mutations but still reads state', async () => {
		const { client, calls } = createClientMock([])
		await new TenantConfigApplier().apply(client, {
			config: { password: { minLength: 8 } },
			identityProviders: { google: { type: 'oidc', configuration: {} } },
			mailTemplates: [{ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c' }],
		}, { dryRun: true })
		expect(calls).toEqual([])
	})
})
