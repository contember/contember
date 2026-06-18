import { ContentEvent, CreateEvent, DeleteEvent, EventType, TruncateEvent, UpdateEvent } from '../../events/index.js'
import { assertNever } from '../../../utils/index.js'

export type EventRow = {
	id: string
	type: EventType
	table_name: string | null
	row_ids: string[] | null
	values: Record<string, any> | null
	created_at: Date
	applied_at: Date
	identity_id: string
	transaction_id: string
}

export const createEventsFromRows = (rows: EventRow[]): ContentEvent[] => {
	return rows.map(event => {
		switch (event.type) {
			case EventType.create:
				return new CreateEvent(
					event.id,
					event.created_at,
					event.applied_at,
					event.identity_id,
					event.transaction_id,
					event.row_ids ?? [],
					event.table_name ?? '',
					event.values ?? {},
				)
			case EventType.update:
				return new UpdateEvent(
					event.id,
					event.created_at,
					event.applied_at,
					event.identity_id,
					event.transaction_id,
					event.row_ids ?? [],
					event.table_name ?? '',
					event.values ?? {},
				)
			case EventType.delete:
				return new DeleteEvent(
					event.id,
					event.created_at,
					event.applied_at,
					event.identity_id,
					event.transaction_id,
					event.row_ids ?? [],
					event.table_name ?? '',
				)
			case EventType.truncate:
				return new TruncateEvent(
					event.id,
					event.created_at,
					event.applied_at,
					event.identity_id,
					event.transaction_id,
				)
			default:
				assertNever(event.type)
		}
	})
}
