import {
	ConditionBuilder,
	DatabaseQuery,
	DatabaseQueryable,
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
			.match(createInMatcher('transactions', this.filter.transactions))
			.match(createInMatcher('identities', this.filter.identities))
			.match(createDateMatcher('created_at', this.filter.createdAt ?? undefined))
			.match(createDateMatcher('applied_at', this.filter.appliedAt ?? undefined))
			.match(qb => {
				if (!this.filter.rows) {
					return qb
				}
				type PrimaryKey = readonly string[]
				const byTable: Record<string, PrimaryKey[]> = {}
				for (const row of this.filter.rows) {
					byTable[row.tableName] ??= []
					byTable[row.tableName].push(row.primaryKey)
				}
				const rowFilters = Object.entries(byTable)
				const ors = rowFilters.reduce(
					(expr, [table, rowIds]) =>
						expr.and(
							ConditionBuilder.create()
								.compare('table_name', Operator.eq, table)
								.in('row_ids', rowIds.map(it => JSON.stringify(it))),
						),
					ConditionBuilder.create(),
				)
				return qb.where(ConditionBuilder.create().or(ors))
			})

			.limit(this.limit, this.offset)

		return createEventsFromRows(await qb.getResult(db))
	}

}
