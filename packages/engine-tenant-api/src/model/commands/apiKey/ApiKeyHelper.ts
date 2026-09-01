import { ApiKey } from '../../type/index.js'
import { Providers } from '../../providers.js'
import { plusMinutes } from '../../utils/time.js'
import { Literal } from '@contember/database'

const DEFAULT_EXPIRATION = 30
export class ApiKeyHelper {
	/**
	 * App-clock expiry Date. Kept only for ProlongApiKeyCommand's significance
	 * throttle (a write-rate optimization, not an auth gate). The value actually
	 * stored / compared runs on the DB clock — see {@link getExpirationLiteral}.
	 */
	public static getExpiration(providers: Providers, type: ApiKey.Type, expiration?: number | null): Date | null {
		switch (type) {
			case ApiKey.Type.PERMANENT:
				return null

			case ApiKey.Type.SESSION:
				return plusMinutes(providers.now(), expiration || DEFAULT_EXPIRATION)

			case ApiKey.Type.ONE_OFF:
				return null
		}
	}

	/** Lifetime of a session key in seconds (`expiration` minutes, default 30). */
	public static getSessionExpirationSeconds(expiration?: number | null): number {
		return (expiration || DEFAULT_EXPIRATION) * 60
	}

	/**
	 * DB-clock expiry expression for issuance: `now() + <lifetime>` evaluated on the
	 * database clock, so the expiry gate (ApiKeyByTokenQuery's `is_expired`) compares
	 * against the same clock and cannot be weakened by app/DB skew. NULL for
	 * non-session keys (they never expire). See engine-tenant-api/CLAUDE.md.
	 */
	public static getExpirationLiteral(type: ApiKey.Type, expiration?: number | null): Literal | null {
		return type === ApiKey.Type.SESSION
			? new Literal('now() + make_interval(secs => ?)', [ApiKeyHelper.getSessionExpirationSeconds(expiration)])
			: null
	}
}
