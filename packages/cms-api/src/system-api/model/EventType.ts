export enum EventType {
	init = 'init',
	delete = 'delete',
	update = 'update',
	create = 'create',
	runMigration = 'run_migration',
}

export const ContentEvents: [EventType.delete, EventType.update, EventType.create] = [EventType.delete, EventType.update, EventType.create]
