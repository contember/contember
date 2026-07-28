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
	MailType,
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

export interface TenantCustomRoleRoleConstraint {
	/** Exhaustive: every role observed at the constrained position must appear here. Not a filter, and there is no `denied` counterpart. */
	readonly allowed: readonly string[]
}

export interface TenantCustomRoleTarget {
	readonly globalRoles: TenantCustomRoleRoleConstraint
	readonly projectMemberships: 'none' | 'any'
}

export interface TenantCustomRoleRoleInputConfig {
	readonly roles: TenantCustomRoleRoleConstraint
}

export interface TenantCustomRoleTargetConfig {
	readonly target: TenantCustomRoleTarget
}

export interface TenantCustomRoleMutationConfig extends TenantCustomRoleRoleInputConfig, TenantCustomRoleTargetConfig {
	readonly allowSelf: boolean
}

export interface TenantCustomRoleGlobalApiKeyConfig extends TenantCustomRoleRoleInputConfig {
	readonly allowTrustForwardedClientInfo: boolean
}

export interface TenantCustomRoleChangeProfileConfig extends TenantCustomRoleTargetConfig {
	readonly fields: {
		readonly allowed: readonly ('name' | 'email')[]
	}
}

export interface TenantCustomRoleCreateSessionTokenConfig extends TenantCustomRoleTargetConfig {
	readonly session: {
		readonly maxExpirationMinutes: number
		readonly allowTrustForwardedClientInfo: boolean
	}
}

export interface TenantCustomRoleMailTemplateConfig {
	readonly global: boolean
	readonly projects: readonly string[]
	readonly types: readonly MailType[]
}

export type TenantCustomRoleConfigFreePermission =
	| 'system:configure'
	| 'system:viewConfig'
	| 'system:viewAuthLog'
	| 'person:view'
	| 'person:list'
	| 'entrypoint:deployEntrypoint'
	| 'apiKey:list'
	| 'idp:disable'
	| 'idp:enable'
	| 'idp:list'
	| 'customRole:view'
	| 'identity:viewPermissions'

export type TenantCustomRoleTargetPermission =
	| 'person:disable'
	| 'person:forceSignOut'
	| 'person:resetMfa'
	| 'person:viewSessions'
	| 'person:viewIdp'
	| 'person:changePassword'

export type TenantCustomRoleMutationPermission =
	| 'identity:addGlobalRoles'
	| 'identity:removeGlobalRoles'

export type TenantCustomRoleMailTemplatePermission =
	| 'mailTemplate:add'
	| 'mailTemplate:remove'
	| 'mailTemplate:list'

/**
 * A custom-role grant discriminated by `permission`. Configured permissions
 * require their exact action-specific config; config-free permissions reject it.
 */
export type TenantCustomRoleGrant =
	| {
		readonly permission: TenantCustomRoleConfigFreePermission
		readonly config?: never
	}
	| {
		readonly permission: 'person:signUp'
		readonly config: TenantCustomRoleRoleInputConfig
	}
	| {
		readonly permission: TenantCustomRoleTargetPermission
		readonly config: TenantCustomRoleTargetConfig
	}
	| {
		readonly permission: 'person:changeProfile'
		readonly config: TenantCustomRoleChangeProfileConfig
	}
	| {
		readonly permission: 'person:createSessionToken'
		readonly config: TenantCustomRoleCreateSessionTokenConfig
	}
	| {
		readonly permission: TenantCustomRoleMutationPermission
		readonly config: TenantCustomRoleMutationConfig
	}
	| {
		readonly permission: 'apiKey:createGlobal'
		readonly config: TenantCustomRoleGlobalApiKeyConfig
	}
	| {
		readonly permission: TenantCustomRoleMailTemplatePermission
		readonly config: TenantCustomRoleMailTemplateConfig
	}

export interface TenantCustomRoleConfig {
	readonly description?: string | null
	readonly grants: readonly TenantCustomRoleGrant[]
}

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
	/** Custom roles keyed by slug. Missing roles are created; existing roles are replaced. */
	customRoles?: Record<string, TenantCustomRoleConfig>
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
