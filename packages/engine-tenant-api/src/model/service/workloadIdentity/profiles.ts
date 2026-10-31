import { WorkloadIdentity } from '../../type/index.js'

export type ClaimType = 'string' | 'number'

export interface WorkloadProfileDefinition {
	/** `null` = the algorithm list is configurable per trust, with this default. */
	readonly fixedSigningAlgs: readonly string[] | null
	readonly defaultSigningAlgs: readonly string[]
	readonly fixedAcceptedTyp: readonly (string | null)[] | null
	readonly defaultAcceptedTyp: readonly (string | null)[]
	/** Claims a token must carry to be this kind of token at all (RFC 8725 §3.11–§3.12). */
	readonly requiredClaims: readonly string[]
	/** Declared top-level claim types; apply rejects an operand that cannot match them. */
	readonly claimTypes: Readonly<Record<string, ClaimType>>
	readonly maxLifetimeSeconds: number
	readonly allowsDpop: boolean
	readonly allowsAudienceArray: boolean
	/** At least one condition must pin one of these claims with `equals` or `in`, so the conditions select a principal. */
	readonly anchorClaims: readonly string[]
}

export const ASYMMETRIC_SIGNING_ALGS: readonly string[] = ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512', 'EdDSA']

export const DEFAULT_MAX_TOKEN_LIFETIME_SECONDS = 3600

/** Accepted on `iat`, `nbf` and `exp`; far below any lifetime in play. */
export const CLOCK_TOLERANCE_SECONDS = 30

export const GITHUB_ACTIONS_ISSUER = 'https://token.actions.githubusercontent.com'

/** Issuers with a dedicated profile; the `oidc` profile refuses them and apply points to the profile. */
export const DEDICATED_PROFILE_ISSUERS: Readonly<Record<string, WorkloadIdentity.Profile>> = {
	[GITHUB_ACTIONS_ISSUER]: 'github-actions',
}

export const workloadProfiles: Readonly<Record<WorkloadIdentity.Profile, WorkloadProfileDefinition>> = {
	'oidc': {
		fixedSigningAlgs: null,
		defaultSigningAlgs: ['RS256', 'ES256'],
		fixedAcceptedTyp: null,
		defaultAcceptedTyp: ['JWT', null],
		requiredClaims: ['iss', 'sub', 'aud', 'iat', 'exp'],
		claimTypes: { sub: 'string' },
		maxLifetimeSeconds: 86_400,
		allowsDpop: true,
		allowsAudienceArray: true,
		anchorClaims: ['sub'],
	},
	'github-actions': {
		fixedSigningAlgs: ['RS256'],
		defaultSigningAlgs: ['RS256'],
		fixedAcceptedTyp: ['JWT'],
		defaultAcceptedTyp: ['JWT'],
		requiredClaims: ['iss', 'sub', 'aud', 'iat', 'exp', 'jti', 'repository_id', 'repository_owner_id', 'run_id'],
		claimTypes: {
			sub: 'string',
			repository_id: 'string',
			repository_owner_id: 'string',
			run_id: 'string',
			run_number: 'string',
			run_attempt: 'string',
			actor_id: 'string',
			iat: 'number',
			exp: 'number',
			nbf: 'number',
		},
		maxLifetimeSeconds: 86_400,
		allowsDpop: false,
		allowsAudienceArray: false,
		// the issuer serves every repository on GitHub; the immutable ids are what pins one of them
		anchorClaims: ['repository_id', 'repository_owner_id'],
	},
}

/** Claims recorded in the auth log per profile, besides `iss` / `sub` / `jti` (§8.7). */
export const AUDIT_CLAIMS: Readonly<Record<WorkloadIdentity.Profile, readonly string[]>> = {
	'oidc': [],
	'github-actions': ['repository_id', 'run_id', 'run_attempt', 'ref', 'job_workflow_ref', 'environment'],
}
