import { describe, expect, test } from 'bun:test'
import { TenantConfigApplier } from '../src/lib/tenant/TenantConfigApplier.js'
import type { RemoteAuthPolicy, RemoteIdentityProvider, TenantClient } from '../src/lib/tenant/TenantClient.js'
import type { TenantGlobalConfig } from '../src/lib/tenant/tenantConfig.js'

const createClientMock = (existingIdps: RemoteIdentityProvider[] = [], existingPolicies: RemoteAuthPolicy[] = []) => {
	const calls: string[] = []
	const configured: TenantGlobalConfig[] = []
	const client = {
		configure: async (config: TenantGlobalConfig) => {
			calls.push('configure')
			configured.push(config)
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
		listAuthPolicies: async () => existingPolicies,
		createAuthPolicy: async (policy: { roles: readonly string[] }) => {
			calls.push(`createAuthPolicy:${[...policy.roles].sort().join('+')}`)
		},
		updateAuthPolicy: async (id: string) => {
			calls.push(`updateAuthPolicy:${id}`)
		},
	}
	return { client: client as unknown as TenantClient, calls, configured }
}

const captureWarnings = async (fn: () => Promise<unknown>): Promise<string[]> => {
	const warnings: string[] = []
	const originalWarn = console.warn
	console.warn = (message: string) => {
		warnings.push(message)
	}
	try {
		await fn()
	} finally {
		console.warn = originalWarn
	}
	return warnings
}

describe('TenantConfigApplier', () => {
	test('sends configure when global config is present', async () => {
		const { client, calls } = createClientMock()
		await new TenantConfigApplier().apply(client, { config: { password: { minLength: 8 } } })
		expect(calls).toEqual(['configure'])
	})

	// The applier does not model config sections; new ones (here: panel) must reach `configure` verbatim.
	test('forwards the management panel access lists verbatim', async () => {
		const { client, configured } = createClientMock()
		await new TenantConfigApplier().apply(client, {
			config: { panel: { globalRoles: ['super_admin', 'ops'], projectRoles: [] } },
		})
		expect(configured).toEqual([{ panel: { globalRoles: ['super_admin', 'ops'], projectRoles: [] } }])
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

	test('creates an auth policy that does not exist yet', async () => {
		const { client, calls } = createClientMock([], [])
		await new TenantConfigApplier().apply(client, {
			authPolicies: [{ scope: 'global', roles: ['admin'], mfaRequired: true }],
		})
		expect(calls).toEqual(['createAuthPolicy:admin'])
	})

	test('updates the policy targeting the same scope and roles', async () => {
		const { client, calls } = createClientMock([], [{ id: 'p1', scope: 'global', project: null, roles: ['admin'] }])
		await new TenantConfigApplier().apply(client, {
			authPolicies: [{ scope: 'global', roles: ['admin'], mfaRequired: true }],
		})
		expect(calls).toEqual(['updateAuthPolicy:p1'])
	})

	test('matches roles as a set, not as an ordered list', async () => {
		const { client, calls } = createClientMock([], [{ id: 'p1', scope: 'global', project: null, roles: ['editor', 'admin'] }])
		await new TenantConfigApplier().apply(client, {
			authPolicies: [{ scope: 'global', roles: ['admin', 'editor'] }],
		})
		expect(calls).toEqual(['updateAuthPolicy:p1'])
	})

	test('keeps global and project policies with the same roles apart', async () => {
		const { client, calls } = createClientMock([], [{ id: 'p1', scope: 'global', project: null, roles: ['admin'] }])
		await new TenantConfigApplier().apply(client, {
			authPolicies: [{ scope: 'project', project: 'blog', roles: ['admin'] }],
		})
		expect(calls).toEqual(['createAuthPolicy:admin'])
	})

	test('warns about an existing policy the config does not manage', async () => {
		const { client } = createClientMock([], [{ id: 'stale', scope: 'global', project: null, roles: ['old_role'] }])
		const warnings = await captureWarnings(() =>
			new TenantConfigApplier().apply(client, {
				authPolicies: [{ scope: 'global', roles: ['admin'] }],
			})
		)
		expect(warnings).toHaveLength(1)
		expect(warnings[0]).toContain('old_role')
	})

	// An empty list is the case the warning exists for: the config claims to manage
	// policies, so a row left over from an earlier apply keeps enforcing unnoticed.
	test('warns about existing policies when the config lists none', async () => {
		const { client, calls } = createClientMock([], [{ id: 'stale', scope: 'global', project: null, roles: ['old_role'] }])
		const warnings = await captureWarnings(() => new TenantConfigApplier().apply(client, { authPolicies: [] }))
		expect(warnings).toHaveLength(1)
		expect(warnings[0]).toContain('old_role')
		expect(calls).toEqual([])
	})

	test('stays silent about existing policies when the config does not mention them at all', async () => {
		const { client } = createClientMock([], [{ id: 'stale', scope: 'global', project: null, roles: ['old_role'] }])
		const warnings = await captureWarnings(() => new TenantConfigApplier().apply(client, {}))
		expect(warnings).toEqual([])
	})

	test('rejects two config entries targeting the same policy before anything is written', async () => {
		const { client, calls } = createClientMock()
		let thrown: unknown
		try {
			await new TenantConfigApplier().apply(client, {
				config: { password: { minLength: 8 } },
				authPolicies: [
					{ scope: 'global', roles: ['admin', 'editor'], mfaRequired: true },
					{ scope: 'global', roles: ['editor', 'admin'], mfaRequired: false },
				],
			})
		} catch (e) {
			thrown = e
		}
		expect(thrown).toContain('Duplicate auth policy')
		// `configure` comes first in apply(), so an empty call list proves the check ran before it.
		expect(calls).toEqual([])
	})

	test('dry run performs no mutations but still reads state', async () => {
		const { client, calls } = createClientMock([])
		await new TenantConfigApplier().apply(client, {
			config: { password: { minLength: 8 } },
			identityProviders: { google: { type: 'oidc', configuration: {} } },
			mailTemplates: [{ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c' }],
			authPolicies: [{ scope: 'global', roles: ['admin'] }],
		}, { dryRun: true })
		expect(calls).toEqual([])
	})
})
