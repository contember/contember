import { Output } from '@contember/cli-common'
import { authPolicyKey, describeAuthPolicy } from './authPolicy.js'
import { type RemoteAuthPolicy, TenantPolicyClient, TenantProjectClient } from './clients/index.js'
import { TenantConfig } from './tenantConfig.js'

export interface TenantConfigApplyOptions {
	dryRun?: boolean
}

/** The slice of the domain clients the applier drives — structural, so a test can pass a fake. */
export interface TenantConfigApplierClients {
	readonly project: Pick<TenantProjectClient, 'configure' | 'listIdentityProviders' | 'addIdp' | 'updateIdp' | 'enableIdp' | 'disableIdp'>
	readonly policy: Pick<TenantPolicyClient, 'addMailTemplate' | 'listAuthPolicies' | 'createAuthPolicy' | 'updateAuthPolicy'>
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

/** One step of the apply plan. In a dry run it is what would be done, otherwise what was done. */
export interface TenantConfigAction {
	action: TenantConfigActionType
	target: string | null
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
 *
 * Nothing is ever removed — entries missing from the config are left untouched.
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
	): Promise<TenantConfigAction[]> {
		const dryRun = options.dryRun === true
		const actions: TenantConfigAction[] = []
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
					this.output.warn(`Warning: auth policy ${describeAuthPolicy(policy)} exists but is not in the config; it stays in effect.`)
				}
			}
		}

		return actions
	}
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
