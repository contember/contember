import { Command } from '../Command.js'
import { ApiKey } from '../../type/index.js'
import { ApiKeyHelper } from './ApiKeyHelper.js'
import { Literal, QueryBuilder, UpdateBuilder } from '@contember/database'

/**
 * Tracking writes (`last_used_at`) are throttled to at most once per this window, so
 * an idle check must add this slack to avoid prematurely expiring an active session
 * whose `last_used_at` is intentionally stale (see {@link ApiKeyManager.verifyAndProlong}).
 */
export const PROLONG_THROTTLE_MS = 60_000

export interface ApiKeyRequestInfo {
	ip?: string
	userAgent?: string
}

export interface ApiKeyTrackingState {
	lastIp: string | null
	lastUserAgent: string | null
	lastUsedAt: Date | null
}

export class ProlongApiKeyCommand implements Command<void> {
	constructor(
		private readonly id: string,
		private readonly type: ApiKey.Type,
		private readonly expiration: number | null,
		private readonly currentExpiration: Date | null,
		private readonly requestInfo?: ApiKeyRequestInfo,
		private readonly tracking?: ApiKeyTrackingState,
		private readonly maxExpiresAt?: Date | null,
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		let newExpiration = ApiKeyHelper.getExpiration(providers, this.type, this.expiration)
		// A19: clamp the sliding window at the absolute cap snapshotted at sign-in.
		// NULL maxExpiresAt = today's uncapped sliding window.
		if (newExpiration !== null && this.maxExpiresAt && newExpiration.getTime() > this.maxExpiresAt.getTime()) {
			newExpiration = this.maxExpiresAt
		}
		const now = providers.now()

		let updateExpiration = newExpiration !== null
		if (updateExpiration && this.currentExpiration && newExpiration !== null) {
			const prolongMs = newExpiration.getTime() - this.currentExpiration.getTime()
			if (prolongMs > 0 && prolongMs < PROLONG_THROTTLE_MS) {
				updateExpiration = false
			}
		}

		const requestIp = this.requestInfo?.ip || null
		const requestUserAgent = this.requestInfo?.userAgent || null
		const updateTracking = this.shouldUpdateTracking(now, requestIp, requestUserAgent)

		if (!updateExpiration && !updateTracking) {
			return
		}

		const values: QueryBuilder.Values = {}
		if (updateExpiration && newExpiration !== null) {
			// Write the sliding expiry on the DB clock and clamp to the stored
			// max_expires_at in SQL (LEAST ignores a NULL cap → uncapped window). The JS
			// throttle above only decides *whether* to write; the expiry gate itself is
			// computed on the DB clock. See engine-tenant-api/CLAUDE.md.
			values.expires_at = new Literal('LEAST(now() + make_interval(secs => ?), "max_expires_at")', [
				ApiKeyHelper.getSessionExpirationSeconds(this.expiration),
			])
		}
		if (updateTracking) {
			values.last_ip = requestIp
			values.last_user_agent = requestUserAgent
			values.last_used_at = now
		}

		const qb = UpdateBuilder.create()
			.table('api_key')
			.where({ id: this.id })
			.values(values)
		await qb.execute(db)
	}

	private shouldUpdateTracking(now: Date, requestIp: string | null, requestUserAgent: string | null): boolean {
		if (!this.requestInfo) {
			return false
		}
		const last = this.tracking
		if (!last || last.lastUsedAt === null) {
			return true
		}
		if (requestIp !== last.lastIp || requestUserAgent !== last.lastUserAgent) {
			return true
		}
		return now.getTime() - last.lastUsedAt.getTime() >= PROLONG_THROTTLE_MS
	}
}
