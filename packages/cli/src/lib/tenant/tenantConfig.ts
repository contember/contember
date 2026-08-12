import type {
	AuthPolicyInput,
	ConfigCaptchaInput,
	ConfigInput,
	ConfigLoginInput,
	ConfigPasswordInput,
	ConfigPasswordlessInput,
	ConfigRateLimitsInput,
	ConfigRateLimitWindowInput,
	IDPOptions,
	MailTemplate,
} from '@contember/graphql-client-tenant'

// These aliases keep tenant config authoring aligned with the GraphQL schema.
// The generator preserves nullable input fields, including explicit `null`.
export type { AuthPolicyScope, CaptchaProvider, ConfigPolicy, MailType } from '@contember/graphql-client-tenant'

/**
 * ISO 8601 duration string, e.g. `"P1D"` (1 day) or `"PT5M"` (5 minutes).
 */
export type Interval = string

export type TenantPasswordConfig = ConfigPasswordInput

export type TenantLoginConfig = ConfigLoginInput

export type TenantPasswordlessConfig = ConfigPasswordlessInput

/**
 * `provider: null` disables captcha verification.
 * `secret` is write-only: `null`/omitted leaves the stored value unchanged, `''` clears it.
 */
export type TenantCaptchaConfig = ConfigCaptchaInput

export type TenantRateLimitWindow = ConfigRateLimitWindowInput

export type TenantRateLimitsConfig = ConfigRateLimitsInput

/** Maps to the tenant `configure(config: ConfigInput!)` mutation. */
export type TenantGlobalConfig = ConfigInput

export type TenantIdpOptions = IDPOptions

/**
 * A single identity provider. The record key is used as the provider slug.
 * `type` is the handler key registered on the server (built-in: `oidc`,
 * `facebook`, `apple`).
 *
 * This is a CLI-specific composite — the `addIDP`/`updateIDP` mutations take
 * `type`/`configuration`/`options` as separate arguments, not a single input.
 */
export interface TenantIdpConfig {
	type: string
	configuration: Record<string, unknown>
	options?: TenantIdpOptions
	/** When `true`, the provider is disabled (kept, but not usable for sign-in). */
	disabled?: boolean
}

/** Maps to the `addMailTemplate(template: MailTemplate!)` mutation. */
export type TenantMailTemplate = MailTemplate

/**
 * A per-role MFA / session policy. `project` is a project slug, required for
 * `scope: 'project'` and rejected for `scope: 'global'` (validated server-side).
 *
 * Unlike identity providers there is no server-side slug, so entries are matched
 * against existing rows by `scope` + `project` + the `roles` **set** (order does
 * not matter). Editing `roles` therefore reads as a different policy: a new row
 * is created and the old one is left in place — see `TenantConfigApplier`.
 */
export type TenantAuthPolicy = AuthPolicyInput

/**
 * Declarative tenant configuration. Applied idempotently by
 * `contember tenant:apply`.
 */
export interface TenantConfig {
	config?: TenantGlobalConfig
	/** Identity providers keyed by slug. */
	identityProviders?: Record<string, TenantIdpConfig>
	mailTemplates?: TenantMailTemplate[]
	authPolicies?: TenantAuthPolicy[]
}

/**
 * Type-safe helper for authoring a `tenant.config.ts`. Returns the config
 * unchanged — it exists only to provide editor autocompletion and type
 * checking.
 *
 * ```ts
 * import { defineTenantConfig } from '@contember/cli'
 *
 * export default defineTenantConfig({
 *   config: { password: { minLength: 8 } },
 * })
 * ```
 */
export const defineTenantConfig = (config: TenantConfig): TenantConfig => config
