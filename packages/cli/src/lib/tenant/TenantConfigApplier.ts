import { authPolicyKey, describeAuthPolicy } from './authPolicy.js'
import { TenantClient } from './TenantClient.js'
import { TenantConfig } from './tenantConfig.js'

export interface TenantConfigApplyOptions {
	dryRun?: boolean
}

/**
 * Applies a {@link TenantConfig} to a tenant idempotently:
 * - `configure` is a partial merge, so it is always (re)sent.
 * - identity providers are added or updated based on the current state, then
 *   enabled/disabled to match `disabled`.
 * - mail templates are upserted server-side by `addMailTemplate`.
 * - auth policies are matched to existing rows by what they target (scope,
 *   project, role set) and created or updated accordingly; every policy the
 *   config does not cover is warned about, including when the config lists none.
 *
 * Nothing is ever removed — entries missing from the config are left untouched.
 */
export class TenantConfigApplier {
	public async apply(client: TenantClient, config: TenantConfig, options: TenantConfigApplyOptions = {}): Promise<void> {
		const dryRun = options.dryRun === true
		const log = (message: string) => console.log(`${dryRun ? '[dry-run] ' : ''}${message}`)

		// Up front, before anything has been written: two entries targeting the same
		// scope/project/roles are one policy to the applier but two rows server-side.
		assertDistinctAuthPolicies(config.authPolicies)

		if (config.config) {
			log('configure: applying global tenant config')
			if (!dryRun) {
				await client.configure(config.config)
			}
		}

		if (config.identityProviders && Object.keys(config.identityProviders).length > 0) {
			const existing = await client.listIdentityProviders()
			const existingBySlug = new Map(existing.map(it => [it.slug, it]))

			for (const [slug, idp] of Object.entries(config.identityProviders)) {
				const current = existingBySlug.get(slug)
				if (!current) {
					log(`addIDP: ${slug} (${idp.type})`)
					if (!dryRun) {
						await client.addIdp(slug, idp.type, idp.configuration, idp.options)
					}
				} else {
					log(`updateIDP: ${slug} (${idp.type})`)
					if (!dryRun) {
						await client.updateIdp(slug, idp.type, idp.configuration, idp.options)
					}
				}

				const wantDisabled = idp.disabled === true
				const isDisabled = current ? current.disabledAt !== null : false
				if (wantDisabled && !isDisabled) {
					log(`disableIDP: ${slug}`)
					if (!dryRun) {
						await client.disableIdp(slug)
					}
				} else if (!wantDisabled && isDisabled) {
					log(`enableIDP: ${slug}`)
					if (!dryRun) {
						await client.enableIdp(slug)
					}
				}
			}
		}

		if (config.mailTemplates && config.mailTemplates.length > 0) {
			for (const template of config.mailTemplates) {
				log(`addMailTemplate: ${template.type}${template.variant ? `/${template.variant}` : ''}`)
				if (!dryRun) {
					await client.addMailTemplate(template)
				}
			}
		}

		// `[]` is meaningful here, unlike for the other sections: it says "I manage
		// policies and there are none", which is exactly when the warning below matters.
		if (config.authPolicies) {
			const existing = await client.listAuthPolicies()
			const existingByKey = new Map(existing.map(it => [authPolicyKey(it), it]))
			const managedKeys = new Set(config.authPolicies.map(authPolicyKey))

			for (const policy of config.authPolicies) {
				const key = authPolicyKey(policy)
				const current = existingByKey.get(key)
				if (!current) {
					log(`createAuthPolicy: ${describeAuthPolicy(policy)}`)
					if (!dryRun) {
						await client.createAuthPolicy(policy)
					}
				} else {
					log(`updateAuthPolicy: ${describeAuthPolicy(policy)}`)
					if (!dryRun) {
						await client.updateAuthPolicy(current.id, policy)
					}
				}
			}

			// Policies are aggregated strictest-wins, so one left behind by a config
			// edit keeps enforcing. Nothing is pruned, but silence would hide it.
			for (const policy of existing) {
				if (!managedKeys.has(authPolicyKey(policy))) {
					console.warn(`Warning: auth policy ${describeAuthPolicy(policy)} exists but is not in the config; it stays in effect.`)
				}
			}
		}
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
