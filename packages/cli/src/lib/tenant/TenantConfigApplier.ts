import { CliError, ExitCode, Output } from '@contember/cli-common'
import { authPolicyKey, describeAuthPolicy } from './authPolicy.js'
import { type RemoteAuthPolicy, TenantPolicyClient, TenantProjectClient } from './clients/index.js'
import { TenantConfig } from './tenantConfig.js'
import type { WorkloadEnvelopeClosure } from './workloadIdentity/model.js'
import { planWorkloadIdentities, type WorkloadIdentityChange, type WorkloadIdentityPlan } from './workloadIdentity/plan.js'

export interface TenantConfigApplyOptions {
	dryRun?: boolean
}

/** The slice of the domain clients the applier drives — structural, so a test can pass a fake. */
export interface TenantConfigApplierClients {
	readonly project: Pick<
		TenantProjectClient,
		| 'configure'
		| 'listIdentityProviders'
		| 'addIdp'
		| 'updateIdp'
		| 'enableIdp'
		| 'disableIdp'
		| 'listWorkloadIdentityTrusts'
		| 'applyWorkloadIdentityTrust'
		| 'disableWorkloadIdentityTrust'
	>
	readonly policy: Pick<
		TenantPolicyClient,
		'addMailTemplate' | 'listAuthPolicies' | 'createAuthPolicy' | 'updateAuthPolicy' | 'listCustomRoles' | 'createCustomRole' | 'updateCustomRole'
	>
}

export type TenantConfigActionType =
	| 'configure'
	| 'addIdp'
	| 'updateIdp'
	| 'enableIdp'
	| 'disableIdp'
	| 'addMailTemplate'
	| 'createAuthPolicy'
	| 'updateAuthPolicy'
	| 'createCustomRole'
	| 'updateCustomRole'
	| 'createWorkloadIdentity'
	| 'updateWorkloadIdentity'
	| 'disableWorkloadIdentity'

/** One step of the apply plan. In a dry run it is what would be done, otherwise what was done. */
export interface TenantConfigAction {
	action: TenantConfigActionType
	target: string | null
}

export type TenantConfigWarningCode =
	| 'UNMANAGED_AUTH_POLICY'
	| 'WORKLOAD_IDENTITY_REJECTS_EARLIER_TOKENS'
	| 'WORKLOAD_IDENTITY_RENAMED'
	| 'WORKLOAD_IDENTITY_SENSITIVE_ROLE'

/** Server-side state the config does not cover. Nothing is pruned, so it stays in effect. */
export interface TenantConfigWarning {
	code: TenantConfigWarningCode
	target: string
	message: string
}

/**
 * The outcome of an apply. Warnings are returned rather than only printed: `output.warn` is silent
 * outside human mode, and an unmanaged policy is exactly what an agent running `--json` needs to see.
 */
export interface TenantConfigPlan {
	actions: TenantConfigAction[]
	warnings: TenantConfigWarning[]
	/** One entry per trust, unchanged ones included; `null` when the config leaves workload identities unmanaged. */
	workloadIdentities: TenantWorkloadIdentityOutcome[] | null
}

export interface TenantWorkloadIdentityOutcome {
	slug: string
	change: WorkloadIdentityChange
	/** Planned: the apply moves `tokensValidAfter`, so tokens issued before it are rejected. */
	rejectsEarlierTokens: boolean
	/** The server's answer after an apply; `null` in a dry run and for disables and unchanged trusts. */
	tokensValidAfterBumped: boolean | null
	envelopeClosure: WorkloadEnvelopeClosure | null
}

const workloadIdentityActions: Readonly<Record<Exclude<WorkloadIdentityChange, 'unchanged'>, TenantConfigActionType>> = {
	create: 'createWorkloadIdentity',
	update: 'updateWorkloadIdentity',
	disable: 'disableWorkloadIdentity',
}

/**
 * Applies a {@link TenantConfig} to a tenant idempotently:
 * - `configure` is a partial merge and is sent only when the schema maps at least one value to a database change.
 * - identity providers are added or updated based on the current state, then
 *   enabled/disabled to match `disabled`.
 * - mail templates are upserted server-side by `addMailTemplate`.
 * - auth policies are matched to existing rows by what they target (scope,
 *   project, role set) and created or updated accordingly; every policy the
 *   config does not cover is warned about, including when the config lists none.
 * - custom roles are created or updated by slug.
 * - workload identity trusts are reconciled against the listed trusts (see {@link planWorkloadIdentities}).
 *
 * Nothing is ever removed — entries missing from the config are left untouched. The one exception is a
 * present `workloadIdentities` block, which is authoritative: trusts it does not name are disabled.
 *
 * Returns the plan as data; the caller prints it. The applier itself only reports each action on stderr.
 */
export class TenantConfigApplier {
	constructor(
		private readonly output: Output = new Output(),
	) {
	}

	public async apply(
		clients: TenantConfigApplierClients,
		config: TenantConfig,
		options: TenantConfigApplyOptions = {},
	): Promise<TenantConfigPlan> {
		const dryRun = options.dryRun === true
		const actions: TenantConfigAction[] = []
		const warnings: TenantConfigWarning[] = []
		const warn = (code: TenantConfigWarningCode, target: string, message: string) => {
			warnings.push({ code, target, message })
			this.output.warn(message)
		}
		const run = async (action: TenantConfigActionType, target: string | null, execute: () => Promise<void>) => {
			actions.push({ action, target })
			if (dryRun) {
				return
			}
			// info, not progress: `tenant apply` mostly runs in CI, where a non-TTY progress line would leave no record of what was touched
			this.output.info(target === null ? action : `${action}: ${target}`)
			await execute()
		}

		// Up front, before anything has been written: two entries targeting the same
		// scope/project/roles are one policy to the applier but two rows server-side.
		assertDistinctAuthPolicies(config.authPolicies)
		const existingAuthPolicies = config.authPolicies === undefined ? undefined : await clients.policy.listAuthPolicies()
		assertDistinctExistingAuthPolicies(existingAuthPolicies)
		const workloadIdentityPlan = config.workloadIdentities === undefined
			? undefined
			: planWorkloadIdentities(config.workloadIdentities, await clients.project.listWorkloadIdentityTrusts())

		if (config.config && hasEffectiveConfigValue(config.config)) {
			const globalConfig = config.config
			await run('configure', null, () => clients.project.configure(globalConfig))
		}

		if (config.identityProviders && Object.keys(config.identityProviders).length > 0) {
			const existing = await clients.project.listIdentityProviders()
			const existingBySlug = new Map(existing.map(it => [it.slug, it]))

			for (const [slug, idp] of Object.entries(config.identityProviders)) {
				const current = existingBySlug.get(slug)
				if (!current) {
					await run('addIdp', slug, () => clients.project.addIdp(slug, idp.type, idp.configuration, idp.options))
				} else {
					await run('updateIdp', slug, () => clients.project.updateIdp(slug, idp.type, idp.configuration, idp.options))
				}

				const wantDisabled = idp.disabled === true
				const isDisabled = current ? current.disabledAt !== null : false
				if (wantDisabled && !isDisabled) {
					await run('disableIdp', slug, () => clients.project.disableIdp(slug))
				} else if (!wantDisabled && isDisabled) {
					await run('enableIdp', slug, () => clients.project.enableIdp(slug))
				}
			}
		}

		if (config.mailTemplates && config.mailTemplates.length > 0) {
			for (const template of config.mailTemplates) {
				const target = `${template.type}${template.variant ? `/${template.variant}` : ''}`
				await run('addMailTemplate', target, () => clients.policy.addMailTemplate(template))
			}
		}

		// `[]` is meaningful here, unlike for the other sections: it says "I manage
		// policies and there are none", which is exactly when the warning below matters.
		if (config.authPolicies) {
			const existing = existingAuthPolicies ?? []
			const existingByKey = new Map(existing.map(it => [authPolicyKey(it), it]))
			const managedKeys = new Set(config.authPolicies.map(authPolicyKey))

			for (const policy of config.authPolicies) {
				const current = existingByKey.get(authPolicyKey(policy))
				const target = describeAuthPolicy(policy)
				if (!current) {
					await run('createAuthPolicy', target, async () => {
						await clients.policy.createAuthPolicy(policy)
					})
				} else {
					await run('updateAuthPolicy', target, () => clients.policy.updateAuthPolicy(current.id, policy))
				}
			}

			// Policies are aggregated strictest-wins, so one left behind by a config
			// edit keeps enforcing. Nothing is pruned, but silence would hide it.
			for (const policy of existing) {
				if (!managedKeys.has(authPolicyKey(policy))) {
					const target = describeAuthPolicy(policy)
					warn('UNMANAGED_AUTH_POLICY', target, `Auth policy ${target} exists but is not in the config; it stays in effect.`)
				}
			}
		}

		if (config.customRoles && Object.keys(config.customRoles).length > 0) {
			const existing = await clients.policy.listCustomRoles()
			const existingSlugs = new Set(existing.map(role => role.slug))
			const configuredRoles = Object.entries(config.customRoles)
			const missingRoles = configuredRoles.filter(([slug]) => !existingSlugs.has(slug))

			// Create all slugs first so grants may reference roles declared later or cyclically.
			for (const [slug, role] of missingRoles) {
				await run('createCustomRole', slug, () =>
					clients.policy.createCustomRole(slug, {
						description: role.description,
						grants: [],
					}))
			}

			for (const [slug, role] of configuredRoles) {
				await run('updateCustomRole', slug, () => clients.policy.updateCustomRole(slug, role))
			}
		}

		const workloadIdentities = workloadIdentityPlan === undefined
			? null
			: await this.applyWorkloadIdentities(clients, workloadIdentityPlan, run, warn)

		return { actions, warnings, workloadIdentities }
	}

	private async applyWorkloadIdentities(
		clients: TenantConfigApplierClients,
		plan: WorkloadIdentityPlan,
		run: (action: TenantConfigActionType, target: string | null, execute: () => Promise<void>) => Promise<void>,
		warn: (code: TenantConfigWarningCode, target: string, message: string) => void,
	): Promise<TenantWorkloadIdentityOutcome[]> {
		for (const { from, to } of plan.renames) {
			warn(
				'WORKLOAD_IDENTITY_RENAMED',
				to,
				`Workload identity ${to} replaces ${from} with the same issuer and audience. It is a new identity: its identity id in audit and event logs changes.`,
			)
		}
		for (const step of plan.steps) {
			if (step.rejectsEarlierTokens) {
				warn(
					'WORKLOAD_IDENTITY_REJECTS_EARLIER_TOKENS',
					step.slug,
					`Workload identity ${step.slug}: tokens issued before this apply will be rejected (who the trust admits changes).`,
				)
			}
		}

		const pendingSlugs = plan.steps.filter(it => it.mutation !== null).map(it => it.slug)
		const outcomes: TenantWorkloadIdentityOutcome[] = []
		for (const step of plan.steps) {
			const outcome: TenantWorkloadIdentityOutcome = {
				slug: step.slug,
				change: step.change,
				rejectsEarlierTokens: step.rejectsEarlierTokens,
				tokensValidAfterBumped: null,
				envelopeClosure: null,
			}
			outcomes.push(outcome)
			const mutation = step.mutation
			if (mutation === null || step.change === 'unchanged') {
				continue
			}
			await run(workloadIdentityActions[step.change], step.slug, async () => {
				try {
					if (mutation.type === 'disable') {
						await clients.project.disableWorkloadIdentityTrust(step.slug)
						return
					}
					const result = await clients.project.applyWorkloadIdentityTrust(step.slug, mutation.input)
					outcome.tokensValidAfterBumped = result.tokensValidAfterBumped
					outcome.envelopeClosure = result.envelopeClosure
				} catch (error) {
					if (error instanceof CliError && error.code === 'WORKLOAD_CREDENTIAL_FORBIDDEN') {
						throw workloadCredentialForbidden(pendingSlugs, error)
					}
					throw error
				}
			})
			for (const target of sensitiveEnvelopeTargets(outcome.envelopeClosure)) {
				warn(
					'WORKLOAD_IDENTITY_SENSITIVE_ROLE',
					step.slug,
					`Workload identity ${step.slug}: the envelope of ${target.source} may assume role ${target.role}, which carries system.${
						target.flags.join(', system.')
					}.`,
				)
			}
		}
		return outcomes
	}
}

const workloadCredentialForbidden = (pendingSlugs: readonly string[], cause: CliError): CliError =>
	new CliError(
		`The workloadIdentities block changed (${
			pendingSlugs.join(', ')
		}), and the current credential is a workload identity trust, which may not manage trusts. `
			+ 'Apply the workloadIdentities block with a person or API key credential.',
		{
			code: 'WORKLOAD_CREDENTIAL_FORBIDDEN',
			exitCode: ExitCode.Forbidden,
			details: { trusts: pendingSlugs },
			cause,
		},
	)

const sensitiveEnvelopeTargets = (closure: WorkloadEnvelopeClosure | null): { source: string; role: string; flags: readonly string[] }[] => {
	if (closure === null || !('entries' in closure)) {
		return []
	}
	return closure.entries.flatMap(entry =>
		entry.targets
			.filter(target => target.sensitiveSystemFlags.length > 0)
			.map(target => ({ source: `${entry.project}/${entry.role}`, role: target.role, flags: target.sensitiveSystemFlags }))
	)
}

const assertDistinctExistingAuthPolicies = (policies: readonly RemoteAuthPolicy[] | undefined): void => {
	const seen = new Set<string>()
	for (const policy of policies ?? []) {
		const key = authPolicyKey(policy)
		if (seen.has(key)) {
			throw new Error(
				`Duplicate existing auth policy: ${describeAuthPolicy(policy)}. Resolve duplicate rows before applying the tenant config.`,
			)
		}
		seen.add(key)
	}
}

/**
 * A policy's identity is its target, so two config entries with the same
 * scope/project/roles are indistinguishable to the applier but produce two rows
 * server-side — the second of which would then be silently orphaned on the next
 * run. Cheaper to reject than to reconcile.
 */
const assertDistinctAuthPolicies = (policies: TenantConfig['authPolicies']): void => {
	const seen = new Set<string>()
	for (const policy of policies ?? []) {
		const key = authPolicyKey(policy)
		if (seen.has(key)) {
			throw `Duplicate auth policy in the config: ${describeAuthPolicy(policy)}. Policies are identified by scope, project and role set.`
		}
		seen.add(key)
	}
}

/** Null clears only the fields that the tenant update command maps to a nullable database column. */
const nullableConfigClearPaths = new Set([
	'passwordless.url',
	'password.pattern',
	'login.maxTokenExpiration',
	'captcha.provider',
	'captcha.threshold',
])

const hasEffectiveConfigValue = (value: unknown, path: readonly string[] = []): boolean => {
	if (value === undefined) {
		return false
	}
	if (value === null) {
		return nullableConfigClearPaths.has(path.join('.'))
	}
	if (typeof value !== 'object') {
		return true
	}
	return Object.entries(value).some(([key, item]) => hasEffectiveConfigValue(item, [...path, key]))
}
