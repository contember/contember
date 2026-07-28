import { describe, expect, test } from 'bun:test'
import { createTestOutput } from '../../cli-common/tests/lib/testOutput.js'
import { TenantConfigApplier, TenantConfigApplierClients } from '../src/lib/tenant/TenantConfigApplier.js'
import type { RemoteAuthPolicy, RemoteCustomRole, RemoteIdentityProvider } from '../src/lib/tenant/clients/index.js'
import type { TenantCustomRoleConfig, TenantGlobalConfig } from '../src/lib/tenant/tenantConfig.js'
import { defineTenantConfig } from '../src/lib/tenant/tenantConfig.js'

const createPolicy = (policy: Pick<RemoteAuthPolicy, 'id' | 'scope' | 'project' | 'roles'>): RemoteAuthPolicy => ({
	mfaRequired: null,
	tokenExpiration: null,
	idleTimeout: null,
	mfaGraceDuration: null,
	rememberMeAllowed: null,
	...policy,
})

const createClientsMock = (
	existingIdps: RemoteIdentityProvider[] = [],
	existingPolicies: RemoteAuthPolicy[] = [],
	existingCustomRoles: RemoteCustomRole[] = [],
) => {
	const calls: string[] = []
	const configured: TenantGlobalConfig[] = []
	const updatedCustomRoles: { readonly slug: string; readonly role: TenantCustomRoleConfig }[] = []
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
			listCustomRoles: async () => existingCustomRoles,
			createCustomRole: async (slug: string, role: TenantCustomRoleConfig) => {
				calls.push(`createCustomRole:${slug}:${role.grants.length}`)
			},
			updateCustomRole: async (slug: string, role: TenantCustomRoleConfig) => {
				calls.push(`updateCustomRole:${slug}:${role.grants.length}`)
				updatedCustomRoles.push({ slug, role })
			},
		},
	}
	return { clients, calls, configured, updatedCustomRoles }
}

const createApplier = () => {
	const testOutput = createTestOutput()
	return { applier: new TenantConfigApplier(testOutput.output), ...testOutput }
}

describe('TenantConfigApplier', () => {
	test('sends configure when global config is present', async () => {
		const { clients, calls } = createClientsMock()
		const { applier } = createApplier()
		const { actions } = await applier.apply(clients, { config: { password: { minLength: 8 } } })
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
		const { actions } = await applier.apply(clients, {
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
		const { actions } = await applier.apply(clients, {
			config: { captcha: { secret: null, protect: { signUp: null } } },
			identityProviders: { google: { type: 'oidc', configuration: {} } },
		}, { dryRun: true })
		expect(calls).toEqual([])
		expect(actions).toEqual([{ action: 'addIdp', target: 'google' }])
	})

	test('keeps explicit null clears that map to nullable database columns', async () => {
		const { clients, calls } = createClientsMock()
		const { applier } = createApplier()
		const { actions } = await applier.apply(clients, { config: { password: { pattern: null } } })
		expect(calls).toEqual(['configure'])
		expect(actions).toEqual([{ action: 'configure', target: null }])
	})

	test('adds a new identity provider', async () => {
		const { clients, calls } = createClientsMock([])
		const { applier } = createApplier()
		const { actions } = await applier.apply(clients, {
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
		const { actions } = await applier.apply(clients, {
			mailTemplates: [{ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c', variant: 'cs' }],
		})
		expect(calls).toEqual(['addMailTemplate:RESET_PASSWORD_REQUEST'])
		expect(actions).toEqual([{ action: 'addMailTemplate', target: 'RESET_PASSWORD_REQUEST/cs' }])
	})

	test('creates an auth policy that does not exist yet', async () => {
		const { clients, calls } = createClientsMock([], [])
		const { applier } = createApplier()
		const { actions } = await applier.apply(clients, {
			authPolicies: [{ scope: 'global', roles: ['admin'], mfaRequired: true }],
		})
		expect(calls).toEqual(['createAuthPolicy:admin'])
		expect(actions).toEqual([{ action: 'createAuthPolicy', target: 'global [admin]' }])
	})

	test('updates the policy targeting the same scope and roles', async () => {
		const { clients, calls } = createClientsMock([], [createPolicy({ id: 'p1', scope: 'global', project: null, roles: ['admin'] })])
		const { applier } = createApplier()
		const { actions } = await applier.apply(clients, {
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
		const { warnings } = await applier.apply(clients, {
			authPolicies: [{ scope: 'global', roles: ['admin'] }],
		})
		expect(warnings).toEqual([{
			code: 'UNMANAGED_AUTH_POLICY',
			target: 'global [old_role]',
			message: 'Auth policy global [old_role] exists but is not in the config; it stays in effect.',
		}])
		expect(stderr.lines.filter(it => it.includes('stays in effect'))).toHaveLength(1)
	})

	// An empty list is the case the warning exists for: the config claims to manage
	// policies, so a row left over from an earlier apply keeps enforcing unnoticed.
	test('warns about existing policies when the config lists none', async () => {
		const { clients, calls } = createClientsMock([], [createPolicy({ id: 'stale', scope: 'global', project: null, roles: ['old_role'] })])
		const { applier, stderr } = createApplier()
		const { warnings } = await applier.apply(clients, { authPolicies: [] })
		expect(warnings).toHaveLength(1)
		expect(warnings[0].code).toBe('UNMANAGED_AUTH_POLICY')
		expect(stderr.lines).toHaveLength(1)
		expect(stderr.lines[0]).toContain('old_role')
		expect(calls).toEqual([])
	})

	test('stays silent about existing policies when the config does not mention them at all', async () => {
		const { clients } = createClientsMock([], [createPolicy({ id: 'stale', scope: 'global', project: null, roles: ['old_role'] })])
		const { applier, stderr } = createApplier()
		const { warnings } = await applier.apply(clients, {})
		expect(warnings).toEqual([])
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

	test('creates all custom role slugs before applying configured grants', async () => {
		const { clients, calls } = createClientsMock()
		const { applier } = createApplier()
		await applier.apply(clients, {
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
		const { clients, calls } = createClientsMock([], [], [{ slug: 'support' }])
		const { applier } = createApplier()
		await applier.apply(clients, {
			customRoles: {
				support: {
					description: 'Support team',
					grants: [{ permission: 'person:list' }],
				},
			},
		})
		expect(calls).toEqual(['updateCustomRole:support:1'])
	})

	test('clears an existing custom role description explicitly', async () => {
		const { clients, updatedCustomRoles } = createClientsMock([], [], [{ slug: 'support' }])
		const { applier } = createApplier()
		await applier.apply(clients, {
			customRoles: {
				support: {
					description: null,
					grants: [{ permission: 'person:list' }],
				},
			},
		})
		expect(updatedCustomRoles).toEqual([{
			slug: 'support',
			role: {
				description: null,
				grants: [{ permission: 'person:list' }],
			},
		}])
	})

	test('dry run performs no mutations but still reads state and returns the plan', async () => {
		const { clients, calls } = createClientsMock([])
		const { applier } = createApplier()
		const { actions } = await applier.apply(clients, {
			config: { password: { minLength: 8 } },
			identityProviders: { google: { type: 'oidc', configuration: {} } },
			mailTemplates: [{ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c' }],
			authPolicies: [{ scope: 'global', roles: ['admin'] }],
			customRoles: {
				support: { grants: [{ permission: 'person:list' }] },
			},
		}, { dryRun: true })
		expect(calls).toEqual([])
		expect(actions).toEqual([
			{ action: 'configure', target: null },
			{ action: 'addIdp', target: 'google' },
			{ action: 'addMailTemplate', target: 'RESET_PASSWORD_REQUEST' },
			{ action: 'createAuthPolicy', target: 'global [admin]' },
			{ action: 'createCustomRole', target: 'support' },
			{ action: 'updateCustomRole', target: 'support' },
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
