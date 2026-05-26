/**
 * ISO 8601 duration string, e.g. `"P1D"` (1 day) or `"PT5M"` (5 minutes).
 */
export type Interval = string

export type ConfigPolicy = 'always' | 'never' | 'optIn' | 'optOut'

export type CaptchaProvider = 'turnstile' | 'hcaptcha' | 'recaptchaV3'

export interface TenantPasswordConfig {
	minLength?: number
	requireUppercase?: number
	requireLowercase?: number
	requireDigit?: number
	requireSpecial?: number
	pattern?: string | null
	checkBlacklist?: boolean
	checkHibp?: boolean
}

export interface TenantLoginConfig {
	baseBackoff?: Interval
	maxBackoff?: Interval
	attemptWindow?: Interval
	revealUserExists?: boolean
	revealLoginMethod?: boolean
	defaultTokenExpiration?: Interval
	maxTokenExpiration?: Interval | null
}

export interface TenantPasswordlessConfig {
	enabled?: ConfigPolicy
	url?: string | null
	expiration?: Interval
}

export interface TenantCaptchaConfig {
	/** `null` disables captcha verification. */
	provider?: CaptchaProvider | null
	/** Write-only. `null`/omitted leaves the stored value unchanged; `''` clears it. */
	secret?: string | null
	threshold?: number | null
}

export interface TenantRateLimitWindow {
	limit?: number
	window?: Interval
}

export interface TenantRateLimitsConfig {
	signUpPerIp?: TenantRateLimitWindow
	loginPerIp?: TenantRateLimitWindow
	passwordResetPerIp?: TenantRateLimitWindow
	passwordlessInitPerIp?: TenantRateLimitWindow
}

/** Maps to the tenant `configure(config: ConfigInput!)` mutation. */
export interface TenantGlobalConfig {
	password?: TenantPasswordConfig
	login?: TenantLoginConfig
	passwordless?: TenantPasswordlessConfig
	captcha?: TenantCaptchaConfig
	rateLimits?: TenantRateLimitsConfig
}

export interface TenantIdpOptions {
	autoSignUp?: boolean
	exclusive?: boolean
	initReturnsConfig?: boolean
}

/**
 * A single identity provider. The record key is used as the provider slug.
 * `type` is the handler key registered on the server (built-in: `oidc`,
 * `facebook`, `apple`).
 */
export interface TenantIdpConfig {
	type: string
	configuration: Record<string, unknown>
	options?: TenantIdpOptions
	/** When `true`, the provider is disabled (kept, but not usable for sign-in). */
	disabled?: boolean
}

export type MailType =
	| 'EXISTING_USER_INVITED'
	| 'NEW_USER_INVITED'
	| 'RESET_PASSWORD_REQUEST'
	| 'PASSWORDLESS_SIGN_IN'
	| 'FORCED_SIGN_OUT'

export interface TenantMailTemplate {
	projectSlug?: string | null
	type: MailType
	/** Custom variant identifier, e.g. a locale. */
	variant?: string
	subject: string
	content: string
	useLayout?: boolean
	replyTo?: string | null
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
