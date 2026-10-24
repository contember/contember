import { createLocalJWKSet, CryptoKey, errors, FlattenedJWSInput, JSONWebKeySet, JWK, JWTHeaderParameters } from 'jose'
import { WorkloadIdentity } from '../../../type/index.js'
import { noopWorkloadIdentityMetrics, WorkloadIdentityMetrics } from './WorkloadIdentityMetrics.js'
import { WorkloadIssuerFetcher } from './WorkloadIssuerFetcher.js'

/** Where a trust's keys come from: `jwksUri` when set, otherwise OIDC discovery on `issuer`. */
export interface WorkloadKeySource {
	readonly issuer: string
	readonly jwksUri: string | null
}

export type WorkloadKeyResolver = (protectedHeader: JWTHeaderParameters, token: FlattenedJWSInput) => Promise<CryptoKey>

export interface WorkloadJwksRegistryOptions {
	readonly metrics?: WorkloadIdentityMetrics
	readonly fetcher?: WorkloadIssuerFetcher
	/** Milliseconds; the cache's own clock (key ages, cooldowns), never compared with stored timestamps. */
	readonly now?: () => number
	readonly refreshIntervalSeconds?: number
	/** Minimum gap between fetches of one key source after a failure or an unknown `kid`, shared by every trust using it. */
	readonly fetchCooldownSeconds?: number
	readonly maxKeys?: number
}

/** The keys of a source are unavailable: never fetched, or older than the staleness bound and the issuer is unreachable. */
export class WorkloadJwksUnavailableError extends Error {}

interface KeySet {
	readonly resolve: (protectedHeader: JWTHeaderParameters, token: FlattenedJWSInput) => Promise<CryptoKey>
	readonly fetchedAt: number
}

interface KeySourceEntry {
	readonly source: WorkloadKeySource
	keys: KeySet | null
	discovered: { readonly jwksUri: string; readonly fetchedAt: number } | null
	pending: Promise<void> | null
	lastAttemptAt: number | null
	lastFailureAt: number | null
	lastUsedAt: number
	timer: ReturnType<typeof setInterval> | null
}

const DEFAULT_REFRESH_INTERVAL_SECONDS = 300
const DEFAULT_FETCH_COOLDOWN_SECONDS = 30
const DEFAULT_MAX_KEYS = 50
const IDLE_EVICTION_MS = 24 * 3600 * 1000

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const JWK_STRING_MEMBERS = ['kty', 'kid', 'alg', 'use', 'crv', 'n', 'e', 'x', 'y'] as const

// Copies only public members, so a JWKS that leaks private material never imports a private key.
const parseJwk = (value: Record<string, unknown>): JWK => {
	const jwk: JWK = {}
	for (const member of JWK_STRING_MEMBERS) {
		const memberValue = value[member]
		if (typeof memberValue === 'string') {
			jwk[member] = memberValue
		}
	}
	const keyOps = value.key_ops
	if (Array.isArray(keyOps) && keyOps.every((it): it is string => typeof it === 'string')) {
		jwk.key_ops = keyOps
	}
	return jwk
}

const parseJwks = (value: unknown, maxKeys: number): JSONWebKeySet => {
	if (!isRecord(value) || !Array.isArray(value.keys)) {
		throw new WorkloadJwksUnavailableError('JWKS response is not a key set')
	}
	if (value.keys.length > maxKeys) {
		throw new WorkloadJwksUnavailableError(`JWKS response carries more than ${maxKeys} keys`)
	}
	return { keys: value.keys.filter(isRecord).map(parseJwk) }
}

const discoveryUrl = (issuer: string): string => `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`

/**
 * Process-wide JWKS / discovery cache for workload trusts (§11), keyed by key source and fetch policy.
 * Public keys are the only material it holds, so one instance serves every tenant.
 */
export class WorkloadJwksRegistry {
	private readonly entries = new Map<string, KeySourceEntry>()
	private readonly metrics: WorkloadIdentityMetrics
	private readonly fetcher: WorkloadIssuerFetcher
	private readonly now: () => number
	private readonly refreshIntervalMs: number
	private readonly fetchCooldownMs: number
	private readonly maxStalenessMs: number
	private readonly maxKeys: number
	private disposed = false

	constructor(
		public readonly config: WorkloadIdentity.InstanceConfig,
		options: WorkloadJwksRegistryOptions = {},
	) {
		this.metrics = options.metrics ?? noopWorkloadIdentityMetrics
		this.fetcher = options.fetcher ?? new WorkloadIssuerFetcher(config)
		this.now = options.now ?? Date.now
		this.refreshIntervalMs = (options.refreshIntervalSeconds ?? DEFAULT_REFRESH_INTERVAL_SECONDS) * 1000
		this.fetchCooldownMs = (options.fetchCooldownSeconds ?? DEFAULT_FETCH_COOLDOWN_SECONDS) * 1000
		this.maxStalenessMs = config.jwksMaxStalenessSeconds * 1000
		this.maxKeys = options.maxKeys ?? DEFAULT_MAX_KEYS
	}

	/** Fetches (or refreshes in the background) the keys of these sources ahead of the first request. */
	public async prewarm(sources: readonly WorkloadKeySource[]): Promise<void> {
		await Promise.allSettled(sources.map(async source => {
			const entry = this.touch(source)
			if (entry.keys === null) {
				await this.refresh(entry)
			}
		}))
	}

	/** A jose key resolver for one source: last-known-good keys, stale-if-error up to the bound, then fail closed. */
	public getKeyResolver(source: WorkloadKeySource): WorkloadKeyResolver {
		return async (protectedHeader, token) => {
			const entry = this.touch(source)
			const keys = await this.usableKeys(entry)
			try {
				return await keys.resolve(protectedHeader, token)
			} catch (e) {
				if (!(e instanceof errors.JWKSNoMatchingKey)) {
					throw e
				}
				this.metrics.unknownKid()
				if (this.isCoolingDown(entry.lastAttemptAt)) {
					throw e
				}
				await this.refreshOrThrow(entry)
				return await this.requireKeys(entry).resolve(protectedHeader, token)
			}
		}
	}

	/** Stops background refresh timers. */
	public dispose(): void {
		this.disposed = true
		for (const entry of this.entries.values()) {
			if (entry.timer !== null) {
				clearInterval(entry.timer)
			}
		}
		this.entries.clear()
		this.fetcher.dispose()
	}

	private touch(source: WorkloadKeySource): KeySourceEntry {
		const key = source.jwksUri !== null ? `jwks:${source.jwksUri}` : `discovery:${source.issuer}`
		let entry = this.entries.get(key)
		if (entry === undefined) {
			entry = {
				source: { issuer: source.issuer, jwksUri: source.jwksUri },
				keys: null,
				discovered: null,
				pending: null,
				lastAttemptAt: null,
				lastFailureAt: null,
				lastUsedAt: this.now(),
				timer: null,
			}
			if (!this.disposed) {
				this.entries.set(key, entry)
				this.startRefreshTimer(key, entry)
			}
		}
		entry.lastUsedAt = this.now()
		return entry
	}

	private startRefreshTimer(key: string, entry: KeySourceEntry): void {
		const timer = setInterval(() => {
			if (this.now() - entry.lastUsedAt > IDLE_EVICTION_MS) {
				clearInterval(timer)
				this.entries.delete(key)
				return
			}
			this.refresh(entry).catch(() => {
				// counted in refresh(); last-known-good keys stay usable up to the staleness bound
			})
		}, this.refreshIntervalMs)
		timer.unref()
		entry.timer = timer
	}

	private async usableKeys(entry: KeySourceEntry): Promise<KeySet> {
		if (entry.keys !== null && this.now() - entry.keys.fetchedAt < this.maxStalenessMs) {
			return entry.keys
		}
		if (this.isCoolingDown(entry.lastFailureAt)) {
			throw new WorkloadJwksUnavailableError(`Keys of ${this.describe(entry.source)} are unavailable`)
		}
		await this.refreshOrThrow(entry)
		return this.requireKeys(entry)
	}

	private requireKeys(entry: KeySourceEntry): KeySet {
		if (entry.keys === null || this.now() - entry.keys.fetchedAt >= this.maxStalenessMs) {
			throw new WorkloadJwksUnavailableError(`Keys of ${this.describe(entry.source)} are unavailable`)
		}
		return entry.keys
	}

	private async refreshOrThrow(entry: KeySourceEntry): Promise<void> {
		try {
			await this.refresh(entry)
		} catch (e) {
			throw new WorkloadJwksUnavailableError(`Fetching keys of ${this.describe(entry.source)} failed: ${e instanceof Error ? e.message : String(e)}`)
		}
	}

	private isCoolingDown(since: number | null): boolean {
		return since !== null && this.now() - since < this.fetchCooldownMs
	}

	private refresh(entry: KeySourceEntry): Promise<void> {
		if (entry.pending !== null) {
			return entry.pending
		}
		const pending = (async () => {
			entry.lastAttemptAt = this.now()
			try {
				const jwksUri = entry.source.jwksUri ?? await this.discover(entry)
				const jwks = parseJwks(await this.fetcher.fetchJson(jwksUri), this.maxKeys)
				entry.keys = { resolve: createLocalJWKSet(jwks), fetchedAt: this.now() }
				entry.lastFailureAt = null
			} catch (e) {
				entry.lastFailureAt = this.now()
				this.metrics.jwksFetchFailure()
				throw e
			} finally {
				entry.pending = null
			}
		})()
		entry.pending = pending
		return pending
	}

	/** Discovery is cached under the same refresh / stale-if-error policy as the keys. */
	private async discover(entry: KeySourceEntry): Promise<string> {
		const cached = entry.discovered
		if (cached !== null && this.now() - cached.fetchedAt < this.refreshIntervalMs) {
			return cached.jwksUri
		}
		try {
			const document = await this.fetcher.fetchJson(discoveryUrl(entry.source.issuer))
			if (!isRecord(document) || document.issuer !== entry.source.issuer) {
				throw new WorkloadJwksUnavailableError('Discovery document issuer does not equal the configured issuer')
			}
			if (typeof document.jwks_uri !== 'string' || document.jwks_uri === '') {
				throw new WorkloadJwksUnavailableError('Discovery document has no jwks_uri')
			}
			entry.discovered = { jwksUri: document.jwks_uri, fetchedAt: this.now() }
			return document.jwks_uri
		} catch (e) {
			if (cached !== null && this.now() - cached.fetchedAt < this.maxStalenessMs) {
				return cached.jwksUri
			}
			throw e
		}
	}

	private describe(source: WorkloadKeySource): string {
		return source.jwksUri ?? source.issuer
	}
}
