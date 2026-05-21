import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { RateLimitScope } from '../../type/RateLimit'

export class RateLimitCountQuery extends DatabaseQuery<number> {
	constructor(
		private readonly scope: RateLimitScope,
		private readonly keyHash: Buffer,
		private readonly windowStart: Date,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<number> {
		const rows = await SelectBuilder.create<{ count: string }>()
			.from('rate_limit_event')
			.select(new Literal('count(*)::text as count'))
			.where({ scope: this.scope, key_hash: this.keyHash })
			.where(expr => expr.compare('occurred_at', '>=', this.windowStart))
			.getResult(db)
		return Number(rows[0]?.count ?? '0')
	}
}
