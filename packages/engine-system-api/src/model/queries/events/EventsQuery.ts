import {
	ConditionBuilder,
	DatabaseQuery,
	DatabaseQueryable,
	Literal,
	Operator,
	SelectBuilder,
	SelectBuilderSpecification, Value,
} from '@contember/database'
import { ContentEvent } from '../../events'
import { EventsFilter, EventsFilterDate, EventsOrder } from '../../../schema'
import { createEventsFromRows, EventRow } from './EventQueryHelpers'

export class EventsQuery extends DatabaseQuery<ContentEvent[]> {
	constructor(
		private readonly filter: EventsFilter,
		private readonly order: EventsOrder,
		private readonly offset: number,
		private readonly limit: number,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ContentEvent[]> {
		const createDateMatcher = (column: string, dateFilter: EventsFilterDate | undefined): SelectBuilderSpecification => qb => {
			if (!dateFilter) {
				return qb
			}
			const { from, to } = dateFilter
			if (from) {
				qb = qb.where(expr => expr.compare(column, Operator.gte, from))
			}
			if (to) {
				qb = qb.where(expr => expr.compare(column, Operator.lte, to))
			}
			return qb
		}
		const createInMatcher = (column: string | [string, string], values?: readonly Value[] | null): SelectBuilderSpecification => qb => {
			if (!values) {
				return qb
			}
			return qb.where(ConditionBuilder.create().in(column, values))
		}

		const qb = SelectBuilder.create<EventRow>()
			.select('id')
			.select('type')
			.select('table_name')
			.select('row_ids')
			.select('values')
			.select('created_at')
			.select('applied_at')
			.select('identity_id')
			.select(['event_data', 'transaction_id'])

			.from('event_data')
			.join('stage_transaction', undefined, on =>
				on.columnsEq(['event_data', 'transaction_id'], ['stage_transaction', 'transaction_id']),
			)
			.match(qb => {
				switch (this.order) {
					case EventsOrder.AppliedAtAsc:
						return qb.orderBy('applied_at', 'asc')
					case EventsOrder.AppliedAtDesc:
						return qb.orderBy('applied_at', 'desc')
					case EventsOrder.CreatedAtAsc:
						return qb.orderBy('created_at', 'asc')
					case EventsOrder.CreatedAtDesc:
						return qb.orderBy('created_at', 'desc')
				}
			})
			.match(createInMatcher('type', this.filter.types?.map(it => it.toLowerCase())))
			.match(createInMatcher('table_name', this.filter.tables))
			.match(createInMatcher('transaction_id', this.filter.transactions))
			.match(createInMatcher('identity_id', this.filter.identities))
			.match(createDateMatcher('created_at', this.filter.createdAt ?? undefined))
			.match(createDateMatcher('applied_at', this.filter.appliedAt ?? undefined))
			.match(qb => {
				if (!this.filter.rows) {
					return qb
				}

				const ors: Literal[] = this.filter.rows.map(row => {
					const builder = ConditionBuilder.create()
						.compare('table_name', Operator.eq, row.tableName)

					return row.primaryKey.reduce((expr, val, index) => {
						if (val === null) {
							return expr
						}
						return expr.raw(`"row_ids"->${index} = ?::jsonb`, JSON.stringify(val))
					}, builder).getSql()
				}).filter((it): it is Literal => it !== null)

				return qb.where(ConditionBuilder.create().or(ConditionBuilder.create(ors)))
			})

			.limit(this.limit, this.offset)

		return createEventsFromRows(await qb.getResult(db))
	}

}
