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
 * - custom roles are created or updated by slug.
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

		if (config.customRoles && Object.keys(config.customRoles).length > 0) {
			const existing = await client.listCustomRoles()
			const existingSlugs = new Set(existing.map(role => role.slug))
			const configuredRoles = Object.entries(config.customRoles)
			const missingRoles = configuredRoles.filter(([slug]) => !existingSlugs.has(slug))

			// Create all slugs first so grants may reference roles declared later or cyclically.
			for (const [slug, role] of missingRoles) {
				log(`createCustomRole: ${slug}`)
				if (!dryRun) {
					await client.createCustomRole(slug, {
						description: role.description,
						grants: [],
					})
				}
			}

			for (const [slug, role] of configuredRoles) {
				if (existingSlugs.has(slug)) {
					log(`updateCustomRole: ${slug}`)
				}
				if (!dryRun) {
					await client.updateCustomRole(slug, role)
				}
			}
		}
	}
}
