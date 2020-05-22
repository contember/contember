import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { AnyEvent, ContentEvent } from '@contember/engine-common'
import { createEventsFromRows, createEventsQueryBuilder, EventRow } from './EventQueryHelpers'
import { assertEveryIsContentEvent } from '../../events'

export class HistoryQuery extends DatabaseQuery<AnyEvent[]> {
	constructor(
		private readonly headEvent: string,
		private readonly filter?: readonly { tableName: string; rowIds: readonly string[] }[],
	) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<ContentEvent[]> {
		const qb = await createEventsQueryBuilder(qb => qb.where({ id: this.headEvent }))
			.select(new Literal('*'))
			.from('recent_events')
			.where(expr => expr.in('type', ['create', 'update', 'delete']))
			.orderBy('index', 'desc')
		const qbWithFilter = this.applyFilter(qb)
		const rows = await qbWithFilter.getResult(queryable.db)

		const events = createEventsFromRows(rows)
		assertEveryIsContentEvent(events)

		return events
	}

	private applyFilter(qb: SelectBuilder<EventRow>): SelectBuilder<EventRow> {
		const filter = this.filter
		if (!filter) {
			return qb
		}
		return qb.where(expr =>
			expr.or(or =>
				filter.reduce(
					(or, filter) =>
						or.and(and =>
							and
								.raw(`data->>'tableName' = ?`, filter.tableName)
								.raw(`data->'rowId' = to_jsonb(?::text[])`, filter.rowIds),
						),
					or,
				),
			),
		)
	}
}
