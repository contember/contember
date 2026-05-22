import { IPostgresInterval } from 'postgres-interval'

export type AuthPolicyScope = 'global' | 'project'

/** A row of the `auth_policy` table. Intervals come back as {@link IPostgresInterval}, like {@link ConfigRow}. */
export type AuthPolicyRow = {
	readonly id: string
	readonly scope: AuthPolicyScope
	readonly project_id: string | null
	readonly roles: string[]
	readonly mfa_required: boolean | null
	readonly token_expiration: IPostgresInterval | null
	readonly idle_timeout: IPostgresInterval | null
	readonly grace_duration: IPostgresInterval | null
	readonly remember_me_allowed: boolean | null
	readonly created_at: Date
	readonly updated_at: Date
}

/**
 * The effective, aggregated policy for an identity. Shared output of
 * {@link AuthPolicyResolver}: A06 consumes {@link mfaRequired}; A19 will consume
 * the session fields. Where nothing matches, this is the inert baseline
 * (`mfaRequired=false`, session fields null).
 */
export type EffectivePolicy = {
	readonly mfaRequired: boolean
	readonly tokenExpiration: IPostgresInterval | null
	readonly idleTimeout: IPostgresInterval | null
	readonly graceDuration: IPostgresInterval | null
	readonly rememberMeAllowed: boolean | null
}
