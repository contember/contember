export enum EventType {
	delete = 'delete',
	update = 'update',
	create = 'create',
}

export const ContentEvents: [EventType.delete, EventType.update, EventType.create] = [
	EventType.delete,
	EventType.update,
	EventType.create,
]
