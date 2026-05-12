import { Command } from '../Command'
import { ApiKey } from '../../type'
import { ApiKeyHelper } from './ApiKeyHelper'
import { UpdateBuilder } from '@contember/database'

const PROLONG_THROTTLE_MS = 60_000

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
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const newExpiration = ApiKeyHelper.getExpiration(providers, this.type, this.expiration)
		const now = providers.now()

		let updateExpiration = newExpiration !== null
		if (updateExpiration && this.currentExpiration && newExpiration !== null) {
			const prolongMs = newExpiration.getTime() - this.currentExpiration.getTime()
			if (prolongMs > 0 && prolongMs < PROLONG_THROTTLE_MS) {
				updateExpiration = false
			}
		}

		const updateTracking = this.shouldUpdateTracking(now)

		if (!updateExpiration && !updateTracking) {
			return
		}

		const values: Record<string, unknown> = {}
		if (updateExpiration && newExpiration !== null) {
			values.expires_at = newExpiration
		}
		if (updateTracking) {
			values.last_ip = this.requestInfo?.ip ?? null
			values.last_user_agent = this.requestInfo?.userAgent ?? null
			values.last_used_at = now
		}

		const qb = UpdateBuilder.create()
			.table('api_key')
			.where({ id: this.id })
			.values(values)
		await qb.execute(db)
	}

	private shouldUpdateTracking(now: Date): boolean {
		if (!this.requestInfo) {
			return false
		}
		const last = this.tracking
		if (!last || last.lastUsedAt === null) {
			return true
		}
		const ipChanged = (this.requestInfo.ip ?? null) !== last.lastIp
		const userAgentChanged = (this.requestInfo.userAgent ?? null) !== last.lastUserAgent
		if (ipChanged || userAgentChanged) {
			return true
		}
		return now.getTime() - last.lastUsedAt.getTime() >= PROLONG_THROTTLE_MS
	}
}
