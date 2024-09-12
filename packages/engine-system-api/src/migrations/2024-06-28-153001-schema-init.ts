import { escapeValue, MigrationArgs, MigrationBuilder } from '@contember/database-migrations'
import { SystemMigrationArgs } from './types'


export default async function (builder: MigrationBuilder, args: MigrationArgs<SystemMigrationArgs>) {
	const schema = await args.schemaResolver(args.connection)
	if (!schema.meta.id) {
		return
	}
	builder.sql(`INSERT INTO schema(schema, checksum, version, migration_id) 
VALUES(${escapeValue(JSON.stringify(schema.schema))}, ${escapeValue(schema.meta.checksum)}, ${escapeValue(schema.meta.version)}, ${schema.meta.id})`)
}
