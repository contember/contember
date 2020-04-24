import { AnyEvent, EventType } from '@contember/engine-common'
import { Event as ApiEvent, EventType as ApiEventType } from '../../schema'
import { assertNever } from '../../utils'
import { EventPermission } from './EventsPermissionsVerifier'

type EventWithMeta = AnyEvent & { dependencies: string[]; permission: EventPermission }
type EventFilter = { entity: string; id: string }

export class DiffResponseBuilder {
	public buildResponse(events: EventWithMeta[], filter: ReadonlyArray<EventFilter> | null): ApiEvent[] {
		if (filter !== null) {
			if (filter.length === 0) {
				return []
			}
			events = this.filterEvents(events, filter)
		}

		const apiEventTypeMapping = {
			[EventType.create]: ApiEventType.Create,
			[EventType.update]: ApiEventType.Update,
			[EventType.delete]: ApiEventType.Delete,
			[EventType.runMigration]: ApiEventType.RunMigration,
		}

		return events.map(it => ({
			allowed: it.permission === EventPermission.canApply,
			dependencies: it.dependencies,
			id: it.id,
			type: apiEventTypeMapping[it.type],
			description: this.formatDescription(it),
		}))
	}

	private formatDescription(event: EventWithMeta): string {
		if (event.permission === EventPermission.forbidden) {
			return 'Forbidden'
		}

		switch (event.type) {
			case EventType.create:
				return `Creating ${event.tableName}#${event.rowId}`
			case EventType.update:
				return `Updating ${event.tableName}#${event.rowId}`
			case EventType.delete:
				return `Deleting ${event.tableName}#${event.rowId}`
			case EventType.runMigration:
				return `Running migration ${event.version}`
			default:
				return assertNever(event)
		}
	}

	private filterEvents(events: EventWithMeta[], filter: ReadonlyArray<EventFilter>): EventWithMeta[] {
		const entityIds = filter.map(it => it.id)
		const rootEvents: EventWithMeta[] = events.filter(
			it => it.type !== EventType.runMigration && entityIds.includes(it.rowId),
		)
		const eventIds = new Set<string>([])
		const dependenciesMap: { [id: string]: string[] } = events.reduce(
			(acc, event) => ({ ...acc, [event.id]: event.dependencies }),
			{},
		)
		const collectDependencies = (ids: string[]) => {
			ids.forEach(id => {
				if (eventIds.has(id)) {
					return
				}
				eventIds.add(id)
				collectDependencies(dependenciesMap[id] || [])
			})
		}
		const rootEventIds = rootEvents.map(it => it.id)
		collectDependencies(rootEventIds)

		return events.filter(it => eventIds.has(it.id))
	}
}
