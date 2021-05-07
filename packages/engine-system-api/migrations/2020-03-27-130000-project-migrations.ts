import { escapeValue, MigrationBuilder } from '@contember/database-migrations'
import { MigrationArgs } from '../'
import { calculateMigrationChecksum } from '@contember/schema-migrations'
import { DatabaseQuery, DatabaseQueryable } from '@contember/database'

class MigrationEventsQuery extends DatabaseQuery<MigrationEventsQuery.Result> {
	constructor(private readonly stageSlug: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<MigrationEventsQuery.Result> {
		const rows = (
			await queryable.db.query<MigrationEventsQuery.Row>(
				`
					WITH RECURSIVE recent_events(type, previous_id, data) AS (
						SELECT type, previous_id, data, created_at
						FROM system.event
							     JOIN system.stage ON stage.event_id = event.id
						WHERE stage.slug = ?
						UNION ALL
						SELECT event.type, event.previous_id, event.data, event.created_at
						FROM system.event, recent_events
						WHERE event.id = recent_events.previous_id
					)
					SELECT *
					FROM recent_events
					WHERE type = 'run_migration'
				`,
				[this.stageSlug],
			)
		).rows

		return rows.reverse()
	}
}

namespace MigrationEventsQuery {
	export type Row = {
		readonly type: string
		readonly previous_id: string
		readonly created_at: Date
		readonly data: { version: string }
	}
	export type Result = Row[]
}

export default async function (builder: MigrationBuilder, args: MigrationArgs) {
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
