import { DatabaseContext } from '../utils'
import { Providers } from '../providers'
import { Config } from '../type/Config'
import { RateLimitCountQuery } from '../queries/rateLimit/RateLimitCountQuery'
import { RecordRateLimitEventCommand } from '../commands/rateLimit/RecordRateLimitEventCommand'
import { RateLimitScope } from '../type/RateLimit'
import { intervalToSeconds } from '../utils/interval'

export interface RateLimitWindow {
	readonly limit: number
	readonly window: { /* IPostgresInterval shape */ }
}

export interface RateLimitDecision {
	readonly ok: boolean
	readonly retryAfterSeconds?: number
}

/**
 * Sliding-window rate limiter backed by the `rate_limit_event` table.
 *
 * Cost: one COUNT(*) and (on success) one INSERT per check. The event row is
 * recorded only when the call passes — denied calls do not extend the window,
 * matching the spec's "max N successful attempts per window".
 *
 * The raw key (IP, email, ...) is hashed with the configured provider to avoid
 * storing PII at rest.
 */
export class RateLimiter {
	constructor(
		private readonly providers: Pick<Providers, 'hash' | 'now'>,
	) {}

	private hashKey(key: string): Buffer {
		return this.providers.hash(key, 'sha256')
	}

	private resolveWindow(scope: RateLimitScope, config: Config): { limit: number; windowSeconds: number } {
		const r = config.rateLimits
		switch (scope) {
			case 'sign_up_per_ip':
				return { limit: r.signUpPerIp.limit, windowSeconds: intervalToSeconds(r.signUpPerIp.window as any) }
			case 'login_per_ip':
				return { limit: r.loginPerIp.limit, windowSeconds: intervalToSeconds(r.loginPerIp.window as any) }
			case 'password_reset_per_ip':
				return { limit: r.passwordResetPerIp.limit, windowSeconds: intervalToSeconds(r.passwordResetPerIp.window as any) }
			case 'passwordless_init_per_ip':
				return { limit: r.passwordlessInitPerIp.limit, windowSeconds: intervalToSeconds(r.passwordlessInitPerIp.window as any) }
			case 'password_reset_mail_per_email':
				return { limit: r.passwordResetMailPerEmail.limit, windowSeconds: intervalToSeconds(r.passwordResetMailPerEmail.window as any) }
			case 'passwordless_init_mail_per_email':
				return { limit: r.passwordlessInitMailPerEmail.limit, windowSeconds: intervalToSeconds(r.passwordlessInitMailPerEmail.window as any) }
		}
	}

	/**
	 * Check whether the next attempt fits within the configured window without
	 * recording it. Use {@link record} after a successful gating decision.
	 */
	async check(db: DatabaseContext, scope: RateLimitScope, key: string, config: Config): Promise<RateLimitDecision> {
		const { limit, windowSeconds } = this.resolveWindow(scope, config)
		if (limit <= 0 || windowSeconds <= 0) {
			return { ok: true }
		}
		const windowStart = new Date(this.providers.now().getTime() - windowSeconds * 1000)
		const count = await db.queryHandler.fetch(new RateLimitCountQuery(scope, this.hashKey(key), windowStart))
		if (count < limit) {
			return { ok: true }
		}
		return { ok: false, retryAfterSeconds: windowSeconds }
	}

	async record(db: DatabaseContext, scope: RateLimitScope, key: string): Promise<void> {
		await db.commandBus.execute(new RecordRateLimitEventCommand(scope, this.hashKey(key)))
	}

	/**
	 * Atomic check + record. Returns the decision; only records on success.
	 */
	async consume(db: DatabaseContext, scope: RateLimitScope, key: string | null | undefined, config: Config): Promise<RateLimitDecision> {
		if (!key) {
			return { ok: true }
		}
		const decision = await this.check(db, scope, key, config)
		if (decision.ok) {
			await this.record(db, scope, key)
		}
		return decision
	}
}
