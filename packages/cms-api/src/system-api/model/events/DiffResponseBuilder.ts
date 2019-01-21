import { Event } from '../dtos/Event'
import { Event as ApiEvent, EventType as ApiEventType } from '../../schema/types'
import { EventType } from '../EventType'
import { assertNever } from 'cms-common'

class DiffResponseBuilder {
	public buildResponse(events: (Event & { dependencies: string[] })[]): ApiEvent[] {
		const apiEventTypeMapping = {
			[EventType.create]: ApiEventType.CREATE,
			[EventType.update]: ApiEventType.UPDATE,
			[EventType.delete]: ApiEventType.DELETE,
			[EventType.runMigration]: ApiEventType.RUN_MIGRATION,
		}

		return events.map(it => ({
			allowed: true,
			dependencies: it.dependencies,
			id: it.id,
			type: apiEventTypeMapping[it.type],
			description: this.formatDescription(it),
		}))
	}

	private formatDescription(event: Event): string {
		switch (event.type) {
			case EventType.create:
				return `Creating ${event.tableName}#${event.rowId}`
			case EventType.update:
				return `Updating ${event.tableName}#${event.rowId}`
			case EventType.delete:
				return `Deleting ${event.tableName}#${event.rowId}`
			case EventType.runMigration:
				return `Running migration ${event.file}`
			default:
				return assertNever(event)
		}
	}
}

export default DiffResponseBuilder
