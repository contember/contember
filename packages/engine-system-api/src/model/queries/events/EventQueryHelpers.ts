import { AnyEvent, CreateEvent, DeleteEvent, EventType, UpdateEvent } from '@contember/engine-common'
import { assertNever } from '../../../utils'

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
			default:
				assertNever(event.type)
		}
	})
}
