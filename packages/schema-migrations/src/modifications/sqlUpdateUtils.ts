import { MigrationBuilder, Name } from '@contember/database-migrations'

export const dropEventTrigger = (builder: MigrationBuilder, tableName: Name) => {
	builder.dropTrigger(tableName, 'log_event')
}
export const createEventTrigger = (builder: MigrationBuilder, tableName: Name, primaryColumns: string[]) => {
	builder.createTrigger(tableName, 'log_event', {
		when: 'AFTER',
		operation: ['INSERT', 'UPDATE', 'DELETE'],
		level: 'ROW',
		function: {
			schema: 'system',
			name: 'trigger_event',
		},
		functionParams: primaryColumns,
	})
}
