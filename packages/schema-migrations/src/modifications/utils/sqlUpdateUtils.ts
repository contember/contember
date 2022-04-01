import { MigrationBuilder, Name } from '@contember/database-migrations'

export const createEventTrigger = (builder: MigrationBuilder, systemSchema: string, tableName: Name, primaryColumns: string[]) => {
	builder.createTrigger(tableName, 'log_event', {
		when: 'AFTER',
		operation: ['INSERT', 'UPDATE', 'DELETE'],
		level: 'ROW',
		function: {
			schema: systemSchema,
			name: 'trigger_event',
		},
		functionParams: primaryColumns,
	})
}

export const dropEventTrigger = (builder: MigrationBuilder, tableName: Name) => {
	builder.dropTrigger(tableName, 'log_event')
}

export const createEventTrxTrigger = (builder: MigrationBuilder, systemSchema: string, tableName: Name) => {
	builder.createTrigger(tableName, 'log_event_trx', {
		when: 'AFTER',
		operation: ['INSERT', 'UPDATE', 'DELETE'],
		level: 'ROW',
		constraint: true,
		deferrable: true,
		deferred: true,
		function: {
			schema: systemSchema,
			name: 'trigger_event_commit',
		},
	})
}

export const dropEventTrxTrigger = (builder: MigrationBuilder, tableName: Name) => {
	builder.dropTrigger(tableName, 'log_event_trx')
}
