import { AnyEvent, ContentEvent } from './dtos/Event'

export enum EventType {
	init = 'init',
	delete = 'delete',
	update = 'update',
	create = 'create',
	runMigration = 'run_migration',
}

export const ContentEvents: [EventType.delete, EventType.update, EventType.create] = [
	EventType.delete,
	EventType.update,
	EventType.create,
]

export const isContentEvent = (it: AnyEvent): it is ContentEvent => {
	return ContentEvents.includes(it.type as ContentEvent['type'])
}
