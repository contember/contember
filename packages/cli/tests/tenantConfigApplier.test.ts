import { describe, expect, test } from 'bun:test'
import { createTestOutput } from '../../cli-common/tests/lib/testOutput.js'
import { TenantConfigApplier, TenantConfigApplierClients } from '../src/lib/tenant/TenantConfigApplier.js'
import type { RemoteIdentityProvider, TenantAuthPolicy } from '../src/lib/tenant/clients/index.js'
import type { TenantGlobalConfig } from '../src/lib/tenant/tenantConfig.js'

const createPolicy = (policy: Pick<TenantAuthPolicy, 'id' | 'scope' | 'project' | 'roles'>): TenantAuthPolicy => ({
	mfaRequired: null,
	tokenExpiration: null,
	idleTimeout: null,
	mfaGraceDuration: null,
	rememberMeAllowed: null,
	...policy,
})

const createClientsMock = (existingIdps: RemoteIdentityProvider[] = [], existingPolicies: TenantAuthPolicy[] = []) => {
	const calls: string[] = []
	const configured: TenantGlobalConfig[] = []
	const clients: TenantConfigApplierClients = {
		project: {
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
		},
		policy: {
			addMailTemplate: async (template: { type: string }) => {
				calls.push(`addMailTemplate:${template.type}`)
			},
			listAuthPolicies: async () => existingPolicies,
			createAuthPolicy: async (policy: { roles: readonly string[] }) => {
				calls.push(`createAuthPolicy:${[...policy.roles].sort().join('+')}`)
				return 'new-policy-id'
			},
			updateAuthPolicy: async (id: string) => {
				calls.push(`updateAuthPolicy:${id}`)
			},
		},
	}
	return { clients, calls, configured }
}

const createApplier = () => {
	const testOutput = createTestOutput()
	return { applier: new TenantConfigApplier(testOutput.output), ...testOutput }
}

describe('TenantConfigApplier', () => {
	test('sends configure when global config is present', async () => {
		const { clients, calls } = createClientsMock()
		const { applier } = createApplier()
		const actions = await applier.apply(clients, { config: { password: { minLength: 8 } } })
		expect(calls).toEqual(['configure'])
		expect(actions).toEqual([{ action: 'configure', target: null }])
	})

	// The applier does not model config sections; new ones (here: panel) must reach `configure` verbatim.
	test('forwards the management panel access lists verbatim', async () => {
		const { clients, configured } = createClientsMock()
		const { applier } = createApplier()
		await applier.apply(clients, {
			config: { panel: { globalRoles: ['super_admin', 'ops'], projectRoles: [] } },
		})
		expect(configured).toEqual([{ panel: { globalRoles: ['super_admin', 'ops'], projectRoles: [] } }])
	})

	test('skips a schema-level no-op and continues with later actions', async () => {
		const { clients, calls } = createClientsMock([])
		const { applier } = createApplier()
		const actions = await applier.apply(clients, {
			config: { password: { minLength: null }, captcha: { secret: null } },
			identityProviders: { google: { type: 'oidc', configuration: {} } },
			mailTemplates: [{ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c' }],
		})
		expect(calls).toEqual(['addIdp:google', 'addMailTemplate:RESET_PASSWORD_REQUEST'])
		expect(actions).toEqual([
			{ action: 'addIdp', target: 'google' },
			{ action: 'addMailTemplate', target: 'RESET_PASSWORD_REQUEST' },
		])
	})

	test('a dry run omits no-op configure but keeps the rest of the plan', async () => {
		const { clients, calls } = createClientsMock([])
		const { applier } = createApplier()
		const actions = await applier.apply(clients, {
			config: { captcha: { secret: null, protect: { signUp: null } } },
			identityProviders: { google: { type: 'oidc', configuration: {} } },
		}, { dryRun: true })
		expect(calls).toEqual([])
		expect(actions).toEqual([{ action: 'addIdp', target: 'google' }])
	})

	test('keeps explicit null clears that map to nullable database columns', async () => {
		const { clients, calls } = createClientsMock()
		const { applier } = createApplier()
		const actions = await applier.apply(clients, { config: { password: { pattern: null } } })
		expect(calls).toEqual(['configure'])
		expect(actions).toEqual([{ action: 'configure', target: null }])
	})

	test('adds a new identity provider', async () => {
		const { clients, calls } = createClientsMock([])
		const { applier } = createApplier()
		const actions = await applier.apply(clients, {
			identityProviders: { google: { type: 'oidc', configuration: {} } },
		})
		expect(calls).toEqual(['addIdp:google'])
		expect(actions).toEqual([{ action: 'addIdp', target: 'google' }])
	})

	test('updates an existing identity provider', async () => {
		const { clients, calls } = createClientsMock([{ slug: 'google', type: 'oidc', disabledAt: null }])
		const { applier } = createApplier()
		await applier.apply(clients, {
			identityProviders: { google: { type: 'oidc', configuration: {} } },
		})
		expect(calls).toEqual(['updateIdp:google'])
	})

	test('disables an enabled provider marked disabled', async () => {
		const { clients, calls } = createClientsMock([{ slug: 'google', type: 'oidc', disabledAt: null }])
		const { applier } = createApplier()
		await applier.apply(clients, {
			identityProviders: { google: { type: 'oidc', configuration: {}, disabled: true } },
		})
		expect(calls).toEqual(['updateIdp:google', 'disableIdp:google'])
	})

	test('re-enables a disabled provider no longer marked disabled', async () => {
		const { clients, calls } = createClientsMock([{ slug: 'google', type: 'oidc', disabledAt: '2024-01-01T00:00:00Z' }])
		const { applier } = createApplier()
		await applier.apply(clients, {
			identityProviders: { google: { type: 'oidc', configuration: {} } },
		})
		expect(calls).toEqual(['updateIdp:google', 'enableIdp:google'])
	})

	test('upserts mail templates', async () => {
		const { clients, calls } = createClientsMock()
		const { applier } = createApplier()
		const actions = await applier.apply(clients, {
			mailTemplates: [{ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c', variant: 'cs' }],
		})
		expect(calls).toEqual(['addMailTemplate:RESET_PASSWORD_REQUEST'])
		expect(actions).toEqual([{ action: 'addMailTemplate', target: 'RESET_PASSWORD_REQUEST/cs' }])
	})

	test('creates an auth policy that does not exist yet', async () => {
		const { clients, calls } = createClientsMock([], [])
		const { applier } = createApplier()
		const actions = await applier.apply(clients, {
			authPolicies: [{ scope: 'global', roles: ['admin'], mfaRequired: true }],
		})
		expect(calls).toEqual(['createAuthPolicy:admin'])
		expect(actions).toEqual([{ action: 'createAuthPolicy', target: 'global [admin]' }])
	})

	test('updates the policy targeting the same scope and roles', async () => {
		const { clients, calls } = createClientsMock([], [createPolicy({ id: 'p1', scope: 'global', project: null, roles: ['admin'] })])
		const { applier } = createApplier()
		const actions = await applier.apply(clients, {
			authPolicies: [{ scope: 'global', roles: ['admin'], mfaRequired: true }],
		})
		expect(calls).toEqual(['updateAuthPolicy:p1'])
		expect(actions).toEqual([{ action: 'updateAuthPolicy', target: 'global [admin]' }])
	})

	test('matches roles as a set, not as an ordered list', async () => {
		const { clients, calls } = createClientsMock([], [createPolicy({ id: 'p1', scope: 'global', project: null, roles: ['editor', 'admin'] })])
		const { applier } = createApplier()
		await applier.apply(clients, {
			authPolicies: [{ scope: 'global', roles: ['admin', 'editor'] }],
		})
		expect(calls).toEqual(['updateAuthPolicy:p1'])
	})

	test('keeps global and project policies with the same roles apart', async () => {
		const { clients, calls } = createClientsMock([], [createPolicy({ id: 'p1', scope: 'global', project: null, roles: ['admin'] })])
		const { applier } = createApplier()
		await applier.apply(clients, {
			authPolicies: [{ scope: 'project', project: 'blog', roles: ['admin'] }],
		})
		expect(calls).toEqual(['createAuthPolicy:admin'])
	})

	test('warns about an existing policy the config does not manage', async () => {
		const { clients } = createClientsMock([], [createPolicy({ id: 'stale', scope: 'global', project: null, roles: ['old_role'] })])
		const { applier, stderr } = createApplier()
		await applier.apply(clients, {
			authPolicies: [{ scope: 'global', roles: ['admin'] }],
		})
		const warnings = stderr.lines.filter(it => it.includes('stays in effect'))
		expect(warnings).toHaveLength(1)
		expect(warnings[0]).toContain('old_role')
	})

	// An empty list is the case the warning exists for: the config claims to manage
	// policies, so a row left over from an earlier apply keeps enforcing unnoticed.
	test('warns about existing policies when the config lists none', async () => {
		const { clients, calls } = createClientsMock([], [createPolicy({ id: 'stale', scope: 'global', project: null, roles: ['old_role'] })])
		const { applier, stderr } = createApplier()
		await applier.apply(clients, { authPolicies: [] })
		expect(stderr.lines).toHaveLength(1)
		expect(stderr.lines[0]).toContain('old_role')
		expect(calls).toEqual([])
	})

	test('stays silent about existing policies when the config does not mention them at all', async () => {
		const { clients } = createClientsMock([], [createPolicy({ id: 'stale', scope: 'global', project: null, roles: ['old_role'] })])
		const { applier, stderr } = createApplier()
		await applier.apply(clients, {})
		expect(stderr.text).toBe('')
	})

	test('rejects two config entries targeting the same policy before anything is written', async () => {
		const { clients, calls } = createClientsMock()
		const { applier } = createApplier()
		let thrown: unknown
		try {
			await applier.apply(clients, {
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

	test('rejects duplicate existing policies before anything is written', async () => {
		const duplicate = { scope: 'global' as const, project: null, roles: ['admin'] }
		const { clients, calls } = createClientsMock([], [
			createPolicy({ id: 'p1', ...duplicate }),
			createPolicy({ id: 'p2', ...duplicate }),
		])
		const { applier } = createApplier()
		let thrown: unknown
		try {
			await applier.apply(clients, {
				config: { password: { minLength: 8 } },
				authPolicies: [{ scope: 'global', roles: ['admin'] }],
			})
		} catch (e) {
			thrown = e
		}
		expect(thrown).toBeInstanceOf(Error)
		if (thrown instanceof Error) {
			expect(thrown.message).toContain('Duplicate existing auth policy')
		}
		expect(calls).toEqual([])
	})

	test('dry run performs no mutations but still reads state and returns the plan', async () => {
		const { clients, calls } = createClientsMock([])
		const { applier } = createApplier()
		const actions = await applier.apply(clients, {
			config: { password: { minLength: 8 } },
			identityProviders: { google: { type: 'oidc', configuration: {} } },
			mailTemplates: [{ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c' }],
			authPolicies: [{ scope: 'global', roles: ['admin'] }],
		}, { dryRun: true })
		expect(calls).toEqual([])
		expect(actions).toEqual([
			{ action: 'configure', target: null },
			{ action: 'addIdp', target: 'google' },
			{ action: 'addMailTemplate', target: 'RESET_PASSWORD_REQUEST' },
			{ action: 'createAuthPolicy', target: 'global [admin]' },
		])
	})

	// createTestOutput defaults to a non-TTY stderr, which is what CI looks like — `progress()` would print nothing here
	test('reports every executed action on stderr even without a TTY, and writes nothing to stdout', async () => {
		const { clients } = createClientsMock([{ slug: 'google', type: 'oidc', disabledAt: null }])
		const { applier, stdout, stderr } = createApplier()

		await applier.apply(clients, {
			config: { password: { minLength: 8 } },
			identityProviders: { google: { type: 'oidc', configuration: {}, disabled: true } },
			mailTemplates: [{ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c' }],
		})

		expect(stderr.lines).toEqual([
			'configure',
			'updateIdp: google',
			'disableIdp: google',
			'addMailTemplate: RESET_PASSWORD_REQUEST',
		])
		expect(stdout.text).toBe('')
	})

	test('a dry run reports nothing — no action was taken', async () => {
		const { clients } = createClientsMock([])
		const { applier, stdout, stderr } = createApplier()

		await applier.apply(clients, { config: { password: { minLength: 8 } } }, { dryRun: true })

		expect(stderr.text).toBe('')
		expect(stdout.text).toBe('')
	})
})
