import { MigrationBuilder, Name } from '@contember/database-migrations'
import { formatSchemaName, getJunctionTables, MigrationArgs } from '..'

const recreateTrigger = (builder: MigrationBuilder, tableName: Name) => {
	builder.dropTrigger(tableName, 'log_event_trx', { ifExists: true })
	builder.dropTrigger(tableName, 'log_event_statement', { ifExists: true })
	builder.createTrigger(tableName, 'log_event_trx', {
		when: 'AFTER',
		operation: ['INSERT', 'UPDATE', 'DELETE'],
		level: 'ROW',
		constraint: true,
		deferrable: true,
		deferred: true,
		function: {
			schema: 'system',
			name: 'trigger_event_commit',
		},
	})
}

export default async function (builder: MigrationBuilder, args: MigrationArgs) {
	const schema = await args.schemaResolver()
	const junctionTables = getJunctionTables(schema.model)
	const schemas = args.project.stages.map(formatSchemaName)

	for (const table of junctionTables) {
		for (const schema of schemas) {
			recreateTrigger(builder, { name: table.tableName, schema })
		}
	}
	for (const entity of Object.values(schema.model.entities)) {
		for (const schema of schemas) {
			recreateTrigger(builder, { name: entity.tableName, schema })
		}
	}
}
