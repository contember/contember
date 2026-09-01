import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { RateLimitScope } from '../../type/RateLimit.js'

export class RateLimitCountQuery extends DatabaseQuery<number> {
	constructor(
		private readonly scope: RateLimitScope,
		private readonly keyHash: Buffer,
		private readonly windowSeconds: number,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<number> {
		// The window start is computed against the database clock (NOW()), not the
		// application clock, so the limiter cannot be weakened by app/DB clock skew
		// or by clock divergence between engine instances. See NextLoginAttemptQuery.
		const rows = await SelectBuilder.create<{ count: string }>()
			.from('rate_limit_event')
			.select(new Literal('count(*)::text as count'))
			.where({ scope: this.scope, key_hash: this.keyHash })
			.where(new Literal('occurred_at >= NOW() - make_interval(secs => ?)', [this.windowSeconds]))
			.getResult(db)
		return Number(rows[0]?.count ?? '0')
	}
}
