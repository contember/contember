import { escapeValue, MigrationBuilder } from '@contember/database-migrations'
import { MigrationArgs, MigrationEventsQuery } from '../'
import { calculateMigrationChecksum } from '@contember/schema-migrations'

export default async function(builder: MigrationBuilder, args: MigrationArgs) {
	builder.createTable(
		{
			name: 'schema_migration',
			schema: 'system',
		},
		{
			id: { notNull: true, type: 'SERIAL4' },
			version: { notNull: true, type: 'varchar(20)', unique: true },
			name: { notNull: true, type: 'varchar(255)', unique: true },
			migration: { notNull: true, type: 'json' },
			checksum: { notNull: true, type: 'char(32)' },
			executed_at: { notNull: true, type: 'timestamp', default: 'now()' },
		},
	)
	builder.createIndex({ name: 'schema_migration', schema: 'system' }, ['version'], {
		name: 'system_schema_migration_version',
	})

	if (!args.migrationsResolverFactory) {
		return
	}
	const allMigrations = await args.migrationsResolverFactory(args.project).getMigrations()

	const baseStage = args.project.stages.find(it => !it.base)
	if (!baseStage) {
		throw new Error('base stage not found')
	}
	const migrationEvents = await args.queryHandler.fetch(new MigrationEventsQuery(baseStage.slug))
	if (migrationEvents.length === 0) {
		return
	}
	for (const event of migrationEvents) {
		const version = event.data.version
		const migration = allMigrations.find(it => it.version === version)
		if (!migration) {
			// eslint-disable-next-line no-console
			console.warn(`Previously executed migration ${version} not found`)
			continue
		}
		builder.sql(`INSERT INTO "system"."schema_migration" (version, name, migration, checksum, executed_at)
VALUES (
        ${escapeValue(migration.version)},
        ${escapeValue(migration.name)},
        ${escapeValue(JSON.stringify(migration))},
        ${escapeValue(calculateMigrationChecksum(migration))},
        ${escapeValue(event.created_at.toISOString())}
        )`)
	}
}
