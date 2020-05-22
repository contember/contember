import { DatabaseQuery, DatabaseQueryable, Literal, Operator } from '@contember/database'
import { AnyEvent } from '@contember/engine-common'
import { createEventsFromRows, createEventsQueryBuilder } from './EventQueryHelpers'

class DiffQuery extends DatabaseQuery<AnyEvent[]> {
	constructor(private readonly baseEvent: string, private readonly headEvent: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<AnyEvent[]> {
		const qb = createEventsQueryBuilder(
			qb => qb.where({ id: this.headEvent }),
			qb => qb.where(expr => expr.compare(['recent_events', 'id'], Operator.notEq, this.baseEvent)),
		)
			.select(new Literal('*'))
			.from('recent_events')
			.orderBy('index', 'desc')
		const rows = await qb.getResult(queryable.db)

		if (rows.length < 2 || rows[0].id !== this.baseEvent || rows[rows.length - 1].id !== this.headEvent) {
			throw new Error('Cannot calculate diff.')
		}

		return createEventsFromRows(rows.slice(1))
	}
}

export { DiffQuery }
