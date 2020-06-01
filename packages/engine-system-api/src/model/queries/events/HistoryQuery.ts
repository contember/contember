import { DatabaseQuery, DatabaseQueryable, Literal, Operator, SelectBuilder } from '@contember/database'
import { AnyEvent, ContentEvent } from '@contember/engine-common'
import { createEventsFromRows, createEventsQueryBuilder } from './EventQueryHelpers'
import { assertEveryIsContentEvent } from '../../events'
import { ImplementationException } from '../../../utils'

export class HistoryQuery extends DatabaseQuery<AnyEvent[]> {
	constructor(
		private readonly headEvent: string,
		private readonly filter?: readonly { tableName: string; rowIds: readonly string[] }[],
		private readonly since?: { eventId: string; date?: undefined } | { date: Date; eventId?: undefined },
	) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<ContentEvent[]> {
		const qb = await createEventsQueryBuilder(
			qb => qb.where({ id: this.headEvent }),
			qb => {
				if (!this.since) {
					return qb
				}
				if ('eventId' in this.since && this.since.eventId) {
					const id = this.since.eventId
					return qb.where(expr => expr.compare(['recent_events', 'id'], Operator.notEq, id))
				}
				if ('date' in this.since && this.since.date) {
					const sinceDate = this.since.date
					return qb.where(expr => expr.compare(['event', 'created_at'], Operator.gte, sinceDate))
				}
				throw new ImplementationException()
			},
		)
			.select(new Literal('*'))
			.from('recent_events')
			.where(expr => expr.in('type', ['create', 'update', 'delete']))
			.orderBy('index', 'desc')
			.match(qb => this.applyEntityFilter(qb))
		const qbWithFilter = this.applyEntityFilter(qb)
		const rows = await qbWithFilter.getResult(queryable.db)

		const events = createEventsFromRows(rows)
		assertEveryIsContentEvent(events)

		return events
	}

	private applyEntityFilter<R>(qb: SelectBuilder<R>): SelectBuilder<R> {
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
