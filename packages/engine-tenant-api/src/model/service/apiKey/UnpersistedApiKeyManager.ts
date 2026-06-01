import { computeTokenHash, isTokenHash, timingSafeCompareHash, TokenHash } from '../../utils/index.js'
import { TenantRole } from '../../authorization/index.js'
import { VerifyResult } from './ApiKeyManager.js'

/**
 * Well-known identity id used for super-admin identities authenticated via an
 * unpersisted (configured) root token. The id is stable so that audit logs and
 * created entities consistently reference the same virtual identity, even
 * though no row exists in the `identity` table.
 */
export const UNPERSISTED_ROOT_IDENTITY_ID = 'f3b2c4d6-0000-4000-8000-000000000001'

export interface UnpersistedApiKey {
	readonly tokenHash: TokenHash
	readonly identityId: string
	readonly roles: readonly string[]
}

/**
 * Verifies incoming tokens against a fixed set of root tokens configured out of
 * band (env/config) instead of being stored in the database. This enables token
 * rotation without database writes and avoids persisting the token hash.
 *
 * Token hashes are compared in constant time to avoid leaking information about
 * the configured secret.
 */
export class UnpersistedApiKeyManager {
	private readonly apiKeys: readonly UnpersistedApiKey[]

	constructor(apiKeys: readonly UnpersistedApiKey[] = []) {
		this.apiKeys = apiKeys
	}

	get isEmpty(): boolean {
		return this.apiKeys.length === 0
	}

	verify(token: string): VerifyResult | null {
		if (this.apiKeys.length === 0) {
			return null
		}
		const tokenHash = computeTokenHash(token)
		// Iterate over all configured keys (no early return) so that matching
		// remains independent of the position of the matching key.
		let matched: UnpersistedApiKey | null = null
		for (const apiKey of this.apiKeys) {
			if (timingSafeCompareHash(tokenHash, apiKey.tokenHash)) {
				matched = apiKey
			}
		}
		if (matched === null) {
			return null
		}
		return new VerifyResult(
			matched.identityId,
			// There is no persisted api_key row, so there is no api key id.
			matched.identityId,
			[...matched.roles],
			null,
			false,
		)
	}

	static createRootApiKey(tokenHash: TokenHash): UnpersistedApiKey {
		return {
			tokenHash,
			identityId: UNPERSISTED_ROOT_IDENTITY_ID,
			roles: [TenantRole.SUPER_ADMIN],
		}
	}

	/**
	 * Builds a manager for unpersisted super-admin root tokens from configured
	 * plain tokens and/or pre-computed token hashes.
	 */
	static createForRootTokens(input: {
		tokens?: readonly string[]
		tokenHashes?: readonly string[]
	}): UnpersistedApiKeyManager {
		const hashes: TokenHash[] = []
		for (const token of input.tokens ?? []) {
			if (token.length === 0) {
				continue
			}
			hashes.push(computeTokenHash(token))
		}
		for (const hash of input.tokenHashes ?? []) {
			if (hash.length === 0) {
				continue
			}
			const normalized = hash.toLowerCase()
			if (!isTokenHash(normalized)) {
				throw new Error(`Invalid unpersisted root token hash: expected a 64-character sha256 hex string.`)
			}
			hashes.push(normalized)
		}
		return new UnpersistedApiKeyManager(hashes.map(it => UnpersistedApiKeyManager.createRootApiKey(it)))
	}
}
