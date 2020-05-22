import { AnyEvent, CreateEvent, DeleteEvent, EventType, RunMigrationEvent, UpdateEvent } from '@contember/engine-common'
import { assertNever } from '../../../utils'
import { SelectBuilder, SelectBuilderSpecification } from '@contember/database'

export type EventRow = {
	id: string
	type: EventType
	data: any
	previous_id: string
	created_at: Date
	identity_id: string
	transaction_id: string
	index: number
}

export const createEventsFromRows = (rows: EventRow[]): AnyEvent[] => {
	return rows.map(event => {
		const data = event.data
		switch (event.type) {
			case EventType.create:
				return new CreateEvent(
					event.id,
					event.created_at,
					event.identity_id,
					event.transaction_id,
					typeof data.rowId === 'string' ? [data.rowId] : data.rowId,
					data.tableName,
					data.values,
				)
			case EventType.update:
				return new UpdateEvent(
					event.id,
					event.created_at,
					event.identity_id,
					event.transaction_id,
					typeof data.rowId === 'string' ? [data.rowId] : data.rowId,
					data.tableName,
					data.values,
				)
			case EventType.delete:
				return new DeleteEvent(
					event.id,
					event.created_at,
					event.identity_id,
					event.transaction_id,
					typeof data.rowId === 'string' ? [data.rowId] : data.rowId,
					data.tableName,
				)
			case EventType.runMigration:
				return new RunMigrationEvent(event.id, event.created_at, event.identity_id, event.transaction_id, data.version)

			case EventType.init:
				throw new Error('init migration should not be in a diff result')
			default:
				assertNever(event.type)
		}
	})
}

export const createEventsQueryBuilder = <R = EventRow>(
	initSpec: SelectBuilderSpecification,
	unionSpec?: SelectBuilderSpecification,
): SelectBuilder<R> => {
	const commonFields: SelectBuilderSpecification = qb =>
		qb
			.select(['event', 'id'])
			.select(['event', 'type'])
			.select(['event', 'data'])
			.select(['event', 'previous_id'])
			.select(['event', 'created_at'])
			.select(['event', 'identity_id'])
			.select(['event', 'transaction_id'])

	return SelectBuilder.create<R>().withRecursive('recent_events', qb => {
		const baseQb = qb
			.match(commonFields)
			.select(expr => expr.raw('0'), 'index')
			.from('event')
			.match(initSpec)

		return baseQb.unionAll(qb => {
			return qb
				.match(commonFields)
				.select(expr => expr.raw('recent_events.index + 1'), 'index')
				.from('event')
				.join('recent_events', 'recent_events', expr =>
					expr.columnsEq(['event', 'id'], ['recent_events', 'previous_id']),
				)
				.match(unionSpec || (qb => qb))
		})
	})
}
