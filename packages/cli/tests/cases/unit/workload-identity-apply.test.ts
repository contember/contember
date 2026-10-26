import { describe, expect, test } from 'bun:test'
import { CliError, ExitCode } from '@contember/cli-common'
import type { WorkloadIdentityTrustInput } from '@contember/graphql-client-tenant'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import { TenantConfigApplier, TenantConfigApplierClients } from '../../../src/lib/tenant/TenantConfigApplier.js'
import type { TenantWorkloadIdentityConfig, TenantWorkloadIdentityMembership } from '../../../src/lib/tenant/tenantConfig.js'
import { parseEnvelopeClosure, RemoteWorkloadIdentityTrust, WorkloadEnvelopeClosure } from '../../../src/lib/tenant/workloadIdentity/model.js'
import { planWorkloadIdentities } from '../../../src/lib/tenant/workloadIdentity/plan.js'

const syncMembership: TenantWorkloadIdentityMembership = {
	project: 'sites',
	role: 'sync',
	variables: [{ name: 'site', values: ['blog', 'shop'] }],
	assumeMembership: { sync: { variables: { site: 'site' } } },
}

const sitesSync: TenantWorkloadIdentityConfig = {
	profile: 'github-actions',
	issuer: 'https://token.actions.githubusercontent.com',
	audience: 'contember:test:sites-sync',
	conditions: [
		{ claim: 'repository_id', equals: '123456789' },
		{ claim: 'repository_owner_id', equals: '9876543' },
	],
	memberships: [syncMembership],
	maxTokenLifetime: 600,
}

const webBackend: TenantWorkloadIdentityConfig = {
	profile: 'oidc',
	issuer: 'https://auth.example.com',
	audience: 'contember:test:web-backend',
	conditions: [{ claim: 'sub', equals: 'web-backend' }],
	roles: [],
	memberships: [{ project: 'website', role: 'reader' }],
}

/** What the server lists for a config it applied: every default filled in. */
const stored = (
	slug: string,
	config: TenantWorkloadIdentityConfig,
	overrides: Partial<RemoteWorkloadIdentityTrust> = {},
): RemoteWorkloadIdentityTrust => ({
	id: `${slug}-id`,
	slug,
	profile: config.profile,
	issuer: config.issuer,
	audience: config.audience,
	jwksUri: config.jwksUri ?? null,
	signingAlgs: config.signingAlgs ?? (config.profile === 'oidc' ? ['RS256', 'ES256'] : ['RS256']),
	acceptedTyp: config.typ ?? (config.profile === 'oidc' ? ['JWT', null] : ['JWT']),
	acceptAudienceArray: config.acceptAudienceArray ?? false,
	requireDpop: config.requireDpop ?? false,
	conditions: JSON.parse(JSON.stringify(config.conditions)),
	maxTokenLifetime: config.maxTokenLifetime ?? 3600,
	trustForwardedInfo: config.trustForwardedInfo ?? false,
	description: config.description ?? null,
	disabled: config.disabled ?? false,
	tokensValidAfter: '2026-10-01T00:00:00.000Z',
	roles: config.roles ?? [],
	memberships: (config.memberships ?? []).map(it => ({
		project: it.project,
		role: it.role,
		variables: it.variables ?? [],
		assumeMembership: it.assumeMembership ?? null,
	})),
	...overrides,
})

const summary = (plan: ReturnType<typeof planWorkloadIdentities>) =>
	plan.steps.map(it => `${it.change}:${it.slug}${it.rejectsEarlierTokens ? ':bump' : ''}${it.mutation === null ? '' : `:${it.mutation.type}`}`)

describe('workload identity reconciliation plan', () => {
	test('an unchanged block issues no mutation, whatever the order of conditions, roles and variable values', () => {
		const reordered: TenantWorkloadIdentityConfig = {
			...sitesSync,
			conditions: [...sitesSync.conditions].reverse(),
			memberships: [{ ...syncMembership, variables: [{ name: 'site', values: ['shop', 'blog'] }] }],
		}
		const plan = planWorkloadIdentities({ 'sites-sync': reordered, 'web-backend': webBackend }, [
			stored('sites-sync', sitesSync),
			stored('web-backend', webBackend),
		])

		expect(summary(plan)).toEqual(['unchanged:sites-sync', 'unchanged:web-backend'])
	})

	test('server defaults compare equal to omitted config values', () => {
		const explicit = stored('web-backend', webBackend, { signingAlgs: ['ES256', 'RS256'], acceptedTyp: [null, 'JWT'], maxTokenLifetime: 3600 })

		expect(summary(planWorkloadIdentities({ 'web-backend': webBackend }, [explicit]))).toEqual(['unchanged:web-backend'])
	})

	test('turning on acceptAudienceArray rejects earlier tokens', () => {
		const plan = planWorkloadIdentities({ 'web-backend': { ...webBackend, acceptAudienceArray: true } }, [stored('web-backend', webBackend)])

		expect(summary(plan)).toEqual(['update:web-backend:bump:apply'])
	})

	test('a missing trust is created with the whole definition, defaults filled in', () => {
		const plan = planWorkloadIdentities({ 'web-backend': webBackend }, [])
		const step = plan.steps[0]

		expect(summary(plan)).toEqual(['create:web-backend:apply'])
		const expected: WorkloadIdentityTrustInput = {
			profile: 'oidc',
			issuer: 'https://auth.example.com',
			audience: 'contember:test:web-backend',
			conditions: [{ claim: 'sub', equals: 'web-backend' }],
			jwksUri: null,
			signingAlgs: ['RS256', 'ES256'],
			acceptedTyp: ['JWT', null],
			acceptAudienceArray: false,
			requireDpop: false,
			maxTokenLifetime: 3600,
			trustForwardedInfo: false,
			description: null,
			roles: [],
			memberships: [{ project: 'website', role: 'reader', variables: [], assumeMembership: null }],
			disabled: false,
		}
		expect(step?.mutation).toEqual({ type: 'apply', input: expected })
	})

	test('a present block disables every enabled trust it does not name; an empty block disables all', () => {
		const existing = [stored('sites-sync', sitesSync), stored('web-backend', webBackend), stored('old', webBackend, { disabled: true, audience: 'x' })]

		expect(summary(planWorkloadIdentities({ 'web-backend': webBackend }, existing))).toEqual([
			'disable:sites-sync:disable',
			'unchanged:old',
			'unchanged:web-backend',
		])
		expect(summary(planWorkloadIdentities({}, existing))).toEqual([
			'disable:sites-sync:disable',
			'disable:web-backend:disable',
			'unchanged:old',
		])
	})

	test('changes of who the trust admits reject earlier tokens; grant and lifetime changes do not', () => {
		const existing = [stored('web-backend', webBackend)]
		const bumping: Partial<TenantWorkloadIdentityConfig>[] = [
			{ issuer: 'https://auth2.example.com' },
			{ audience: 'contember:test:other' },
			{ conditions: [{ claim: 'sub', equals: 'another-backend' }] },
			{ typ: ['JWT'] },
			{ signingAlgs: ['ES256'] },
			{ jwksUri: 'https://auth.example.com/keys' },
		]
		for (const change of bumping) {
			expect(summary(planWorkloadIdentities({ 'web-backend': { ...webBackend, ...change } }, existing))).toEqual(['update:web-backend:bump:apply'])
		}
		const nonBumping: Partial<TenantWorkloadIdentityConfig>[] = [
			{ roles: ['entrypoint_deployer'] },
			{ memberships: [{ project: 'website', role: 'editor' }] },
			{ maxTokenLifetime: 300 },
			{ description: 'the website backend' },
			{ requireDpop: true },
		]
		for (const change of nonBumping) {
			expect(summary(planWorkloadIdentities({ 'web-backend': { ...webBackend, ...change } }, existing))).toEqual(['update:web-backend:apply'])
		}
	})

	test('re-enabling a trust rejects earlier tokens; a tombstone disables it', () => {
		expect(summary(planWorkloadIdentities({ 'web-backend': webBackend }, [stored('web-backend', webBackend, { disabled: true })])))
			.toEqual(['update:web-backend:bump:apply'])
		expect(summary(planWorkloadIdentities({ 'web-backend': { ...webBackend, disabled: true } }, [stored('web-backend', webBackend)])))
			.toEqual(['disable:web-backend:disable'])
		// a tombstone that also edits the definition carries it in one apply
		expect(
			summary(planWorkloadIdentities({ 'web-backend': { ...webBackend, disabled: true, maxTokenLifetime: 60 } }, [stored('web-backend', webBackend)])),
		)
			.toEqual(['disable:web-backend:apply'])
	})

	test('disables are ordered before upserts', () => {
		const plan = planWorkloadIdentities({ 'a-new': webBackend }, [stored('z-old', { ...webBackend, audience: 'contember:test:old' })])

		expect(summary(plan)).toEqual(['disable:z-old:disable', 'create:a-new:apply'])
	})

	test('a slug rename — a disabled trust and a new one with the same issuer and audience — is reported', () => {
		const removed = planWorkloadIdentities({ 'web-backend-v2': webBackend }, [stored('web-backend', webBackend)])
		expect(removed.renames).toEqual([{ from: 'web-backend', to: 'web-backend-v2' }])
		expect(summary(removed)).toEqual(['disable:web-backend:disable', 'create:web-backend-v2:apply'])

		const tombstoned = planWorkloadIdentities(
			{ 'web-backend': { ...webBackend, disabled: true }, 'web-backend-v2': webBackend },
			[stored('web-backend', webBackend)],
		)
		expect(tombstoned.renames).toEqual([{ from: 'web-backend', to: 'web-backend-v2' }])

		expect(planWorkloadIdentities({ 'other': { ...webBackend, audience: 'contember:test:other' } }, [stored('web-backend', webBackend)]).renames)
			.toEqual([])
	})

	test('enabled trusts sharing an issuer and audience fail before anything is planned', () => {
		const run = () => planWorkloadIdentities({ 'a': webBackend, 'b': webBackend, 'c': { ...webBackend, disabled: true } }, [])

		expect(run).toThrow(CliError)
		try {
			run()
		} catch (error) {
			expect(error).toMatchObject({ code: 'WORKLOAD_IDENTITY_AUDIENCE_CONFLICT', exitCode: ExitCode.InputError, details: { conflicts: [['a', 'b']] } })
		}
	})
})

const closureWithAdmin: WorkloadEnvelopeClosure = {
	entries: [{
		project: 'sites',
		role: 'sync',
		targets: [
			{ role: 'sync', variables: { site: ['blog', 'shop'] }, sensitiveSystemFlags: [] },
			{ role: 'editor', variables: { site: '*' }, sensitiveSystemFlags: ['assumeIdentity'] },
		],
	}],
}

describe('parseEnvelopeClosure', () => {
	test('reads the closure the tenant API returns', () => {
		const response = [{
			project: 'sites',
			membership: { role: 'sync', variables: [{ name: 'site', values: ['blog', 'shop'] }] },
			targets: [
				{ role: 'sync', variables: { site: ['blog', 'shop'] }, unbounded: false, sensitiveFlags: [] },
				{ role: 'editor', variables: { site: '*' }, unbounded: true, sensitiveFlags: ['assumeIdentity'] },
			],
		}]

		expect(parseEnvelopeClosure(response)).toEqual(closureWithAdmin)
	})

	test('keeps a closure of an unexpected shape as raw JSON', () => {
		const response = [{ project: 'sites', role: 'sync', targets: [] }]

		expect(parseEnvelopeClosure(response)).toEqual({ unrecognized: response })
	})
})

const createClients = (existing: RemoteWorkloadIdentityTrust[], failApplyWith?: CliError) => {
	const calls: string[] = []
	const clients: TenantConfigApplierClients = {
		project: {
			configure: async () => {
				calls.push('configure')
			},
			listIdentityProviders: async () => [],
			addIdp: async () => undefined,
			updateIdp: async () => undefined,
			enableIdp: async () => undefined,
			disableIdp: async () => undefined,
			listWorkloadIdentityTrusts: async () => {
				calls.push('list')
				return existing
			},
			applyWorkloadIdentityTrust: async (slug: string, trust: WorkloadIdentityTrustInput, options = {}) => {
				calls.push(`${options.dryRun === true ? 'validate' : 'apply'}:${slug}${trust.disabled === true ? ' (disabled)' : ''}`)
				if (failApplyWith) {
					throw failApplyWith
				}
				return { created: true, tokensValidAfterBumped: false, envelopeClosure: closureWithAdmin }
			},
			disableWorkloadIdentityTrust: async (slug: string) => {
				calls.push(`disable:${slug}`)
			},
		},
		policy: {
			addMailTemplate: async () => undefined,
			listAuthPolicies: async () => [],
			createAuthPolicy: async () => 'id',
			updateAuthPolicy: async () => undefined,
			listCustomRoles: async () => [],
			createCustomRole: async () => undefined,
			updateCustomRole: async () => undefined,
		},
	}
	return { clients, calls }
}

describe("planWorkloadIdentities compares in the server's canonical form", () => {
	test('duplicates and an empty description match what the server stored', () => {
		const config: TenantWorkloadIdentityConfig = {
			...webBackend,
			description: '',
			signingAlgs: ['RS256', 'ES256', 'RS256'],
			typ: ['JWT', null, 'JWT'],
			roles: [],
			conditions: [{ claim: 'sub', equals: 'web-backend' }, { claim: 'sub', equals: 'web-backend' }],
		}
		const remote = stored('web-backend', { ...webBackend, signingAlgs: ['ES256', 'RS256'], typ: ['JWT', null] })

		expect(remote.description).toBeNull()
		expect(planWorkloadIdentities({ 'web-backend': config }, [remote]).steps.map(it => it.change)).toEqual(['unchanged'])
	})

	test('a repeated in operand is no change of who the trust admits', () => {
		const remote = stored('web-backend', { ...webBackend, conditions: [{ claim: 'sub', in: ['a', 'b'] }] })
		const config: TenantWorkloadIdentityConfig = { ...webBackend, conditions: [{ claim: 'sub', in: ['b', 'a', 'b'] }] }

		expect(planWorkloadIdentities({ 'web-backend': config }, [remote]).steps.map(it => it.change)).toEqual(['unchanged'])
	})
})

describe('TenantConfigApplier with workloadIdentities', () => {
	test('an absent block leaves trusts unmanaged and does not even list them', async () => {
		const { clients, calls } = createClients([stored('web-backend', webBackend)])

		const plan = await new TenantConfigApplier(createTestOutput().output).apply(clients, { config: {} })

		expect(calls).toEqual([])
		expect(plan.workloadIdentities).toBeNull()
	})

	test('a dry run plans without mutating and flags the token rejection', async () => {
		const { clients, calls } = createClients([stored('web-backend', webBackend)])

		const plan = await new TenantConfigApplier(createTestOutput().output).apply(
			clients,
			{ workloadIdentities: { 'web-backend': { ...webBackend, issuer: 'https://auth2.example.com' } } },
			{ dryRun: true },
		)

		expect(calls).toEqual(['list', 'validate:web-backend (disabled)'])
		expect(plan.actions).toEqual([{ action: 'updateWorkloadIdentity', target: 'web-backend' }])
		expect(plan.workloadIdentities).toEqual([
			{ slug: 'web-backend', change: 'update', rejectsEarlierTokens: true, tokensValidAfterBumped: null, envelopeClosure: closureWithAdmin },
		])
		expect(plan.warnings.map(it => it.code)).toEqual(['WORKLOAD_IDENTITY_REJECTS_EARLIER_TOKENS', 'WORKLOAD_IDENTITY_SENSITIVE_ROLE'])
	})

	test('applies disables before upserts and reports the closure with its sensitive roles', async () => {
		const { clients, calls } = createClients([stored('old-sync', { ...sitesSync, audience: 'contember:test:old' })])
		const { output, stderr } = createTestOutput()

		const plan = await new TenantConfigApplier(output).apply(clients, { workloadIdentities: { 'sites-sync': sitesSync } })

		expect(calls).toEqual(['list', 'validate:sites-sync (disabled)', 'disable:old-sync', 'apply:sites-sync'])
		expect(plan.workloadIdentities?.find(it => it.slug === 'sites-sync')?.envelopeClosure).toEqual(closureWithAdmin)
		expect(plan.warnings).toEqual([{
			code: 'WORKLOAD_IDENTITY_SENSITIVE_ROLE',
			target: 'sites-sync',
			message: 'Workload identity sites-sync: the envelope of sites/sync may assume role editor, which carries system.assumeIdentity.',
		}])
		expect(stderr.text).toContain('system.assumeIdentity')
	})

	test('a refusal for a workload credential names the trusts that need a person or api key', async () => {
		const refusal = new CliError('applyWorkloadIdentityTrust(sites-sync) failed: WORKLOAD_CREDENTIAL_FORBIDDEN', {
			code: 'WORKLOAD_CREDENTIAL_FORBIDDEN',
			exitCode: ExitCode.Forbidden,
		})
		const { clients, calls } = createClients([stored('web-backend', webBackend)], refusal)

		const promise = new TenantConfigApplier(createTestOutput().output).apply(clients, {
			config: { password: { minLength: 12 } },
			workloadIdentities: { 'sites-sync': sitesSync, 'web-backend': webBackend },
		})

		await expect(promise).rejects.toMatchObject({
			code: 'WORKLOAD_CREDENTIAL_FORBIDDEN',
			exitCode: ExitCode.Forbidden,
			details: { trusts: ['sites-sync'] },
		})
		await expect(promise).rejects.toThrow(/person or API key credential/)
		// refused by the up-front dry run, before the config section or any trust was written
		expect(calls).toEqual(['list', 'validate:sites-sync (disabled)'])
	})

	test('an unchanged block applied by a workload credential issues no mutation at all', async () => {
		const refusal = new CliError('refused', { code: 'WORKLOAD_CREDENTIAL_FORBIDDEN', exitCode: ExitCode.Forbidden })
		const { clients, calls } = createClients([stored('web-backend', webBackend)], refusal)

		const plan = await new TenantConfigApplier(createTestOutput().output).apply(clients, { workloadIdentities: { 'web-backend': webBackend } })

		expect(calls).toEqual(['list'])
		expect(plan.workloadIdentities?.map(it => it.change)).toEqual(['unchanged'])
	})
})
