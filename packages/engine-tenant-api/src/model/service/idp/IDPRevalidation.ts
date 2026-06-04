import * as Typesafe from '@contember/typesafe'

/**
 * Provider-agnostic re-validation settings, stored on an IdP's `configuration.revalidation`.
 * Read both by the provider (to decide whether to capture session state at sign-in) and by
 * the generic verify hook (`ApiKeyManager.verifyAndProlong`) to drive re-validation.
 *
 * The cadence is driven by the **access-token lifetime**, not a fixed interval: while the
 * token is fresh the session is vouched-for and nothing happens; past `softRefreshThreshold`
 * of its lifetime a proactive background (SWR) refresh kicks in; once the token has actually
 * expired the refresh becomes blocking. See {@link IdpSessionRevalidator}.
 *
 * All fields optional; absent / `enabled: false` reproduces the pre-A24 behaviour exactly.
 */
export const IDPRevalidationConfig = Typesafe.partial({
	enabled: Typesafe.boolean,
	/**
	 * Fraction (0–1) of the access-token lifetime after which a proactive background (SWR)
	 * refresh starts — e.g. 0.5 = refresh once the token is half-expired. Default 0.5.
	 */
	softRefreshThreshold: Typesafe.number,
	/**
	 * Single-flight floor as a Postgres interval string: the minimum gap between revalidation
	 * attempts, so a burst of requests past the threshold triggers only one refresh.
	 * Default "10 seconds".
	 */
	minInterval: Typesafe.string,
	/**
	 * Throttle used when the IdP returns no token expiry (so the lifetime-based cadence can't
	 * apply), as a Postgres interval string. Default "5 minutes".
	 */
	fallbackInterval: Typesafe.string,
	/**
	 * `auto` (default): SWR/background before expiry, blocking once expired. `blocking`: always
	 * synchronous (zero revocation lag, at the cost of latency on the revalidation tick).
	 */
	mode: Typesafe.enumeration('auto', 'blocking'),
	/** What to do when the IdP reports the session as gone. Currently only `revoke`. */
	onFailure: Typesafe.enumeration('revoke'),
})

export type IDPRevalidationConfig = ReturnType<typeof IDPRevalidationConfig>

export const REVALIDATION_DEFAULT_SOFT_THRESHOLD = 0.5
export const REVALIDATION_DEFAULT_MIN_INTERVAL = '10 seconds'
export const REVALIDATION_DEFAULT_FALLBACK_INTERVAL = '5 minutes'
