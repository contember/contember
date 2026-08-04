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
 *   project, role set) and created or updated accordingly.
 *
 * Nothing is ever removed — entries missing from the config are left untouched.
 */
export class TenantConfigApplier {
	public async apply(client: TenantClient, config: TenantConfig, options: TenantConfigApplyOptions = {}): Promise<void> {
		const dryRun = options.dryRun === true
		const log = (message: string) => console.log(`${dryRun ? '[dry-run] ' : ''}${message}`)

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

		if (config.authPolicies && config.authPolicies.length > 0) {
			const existing = await client.listAuthPolicies()
			const existingByKey = new Map(existing.map(it => [authPolicyKey(it), it]))
			const managedKeys = new Set<string>()

			for (const policy of config.authPolicies) {
				const key = authPolicyKey(policy)
				managedKeys.add(key)
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
