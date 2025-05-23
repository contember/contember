import {
	GroupMigrationsResolver,
	MigrationGroup,
	MigrationsRunner as DbMigrationsRunner,
	SnapshotMigrationResolver,
} from '@contember/database-migrations'
import _20180804102200init from './2018-08-04-102200-init'
import _20180805130501triggereventfunction from './2018-08-05-130501-trigger-event-function'
import _20190114143432eventtrxid from './2019-01-14-143432-event-trx-id'
import _20190204154500eventrebase from './2019-02-04-154500-event-rebase'
import _20190318104147eventrunmigrationstruct from './2019-03-18-104147-event-run-migration-struct'
import _20190729103000triggereventfunctionfix from './2019-07-29-103000-trigger-event-function-fix'
import _20191128100000missingsettingfallback from './2019-11-28-100000-missing-setting-fallback'
import _20200327130000projectmigrations from './2020-03-27-130000-project-migrations'
import _20200506150000composedprimary from './2020-05-06-150000-composed-primary'
import _20200601103000eventtriggerperf from './2020-06-01-103000-event-trigger-perf'
import _20210323110000timestampfix from './2021-03-23-110000-timestamp-fix'
import _20210507155800eventlogrework from './2021-05-07-155800-event-log-rework'
import _202105191232000eventlogfixconstraint from './2021-05-19-1232000-event-log-fix-constraint'
import _20211221155500eventsup from './2021-12-21-155500-events-up'
import _20220208132600fnsearchpath from './2022-02-08-132600-fn-search-path'
import _20220208140500dropdeadcode from './2022-02-08-140500-drop-deadcode'
import _20220208144400dynamicstageschema from './2022-02-08-144400-dynamic-stage-schema'
import _20221003110000tableondelete from './2022-10-03-110000-table-on-delete'
import _20230911174000fixondelete from './2023-09-11-174000-fix-on-delete'
import _20231019173000fixunique from './2023-10-19-173000-fix-unique'
import _20231024140000schemanullablechecksum from './2023-10-24-140000-schema-nullable-checksum'
import _20240628150000migrationsdropsequence from './2024-06-28-150000-migrations-drop-sequence'
import _20240628153000schema from './2024-06-28-153000-schema'
import _20240628153001schemainit from './2024-06-28-153001-schema-init'
import _20240729150000eventdataindex from './2024-07-29-150000-event-data-index'
import _20250314110000fixmissingindex from './2025-03-14-110000-fix-missing-index'
import snapshot from './snapshot'

import { Connection, createDatabaseIfNotExists, DatabaseConfig, DatabaseMetadataResolver } from '@contember/database'
import { DatabaseContextFactory, SchemaProvider } from '../model'
import { ProjectConfig } from '../types'
import { Logger } from '@contember/logger'

const migrations = {
	'2018-08-04-102200-init': _20180804102200init,
	'2018-08-05-130501-trigger-event-function': _20180805130501triggereventfunction,
	'2019-01-14-143432-event-trx-id': _20190114143432eventtrxid,
	'2019-02-04-154500-event-rebase': _20190204154500eventrebase,
	'2019-03-18-104147-event-run-migration-struct': _20190318104147eventrunmigrationstruct,
	'2019-07-29-103000-trigger-event-function-fix': _20190729103000triggereventfunctionfix,
	'2019-11-28-100000-missing-setting-fallback': _20191128100000missingsettingfallback,
	'2020-03-27-130000-project-migrations': _20200327130000projectmigrations,
	'2020-05-06-150000-composed-primary': _20200506150000composedprimary,
	'2020-06-01-103000-event-trigger-perf': _20200601103000eventtriggerperf,
	'2021-03-23-110000-timestamp-fix': _20210323110000timestampfix,
	'2021-05-07-155800-event-log-rework': _20210507155800eventlogrework,
	'2021-05-19-1232000-event-log-fix-constraint': _202105191232000eventlogfixconstraint,
	'2021-12-21-155500-events-up': _20211221155500eventsup,
	'2022-02-08-132600-fn-search-path': _20220208132600fnsearchpath,
	'2022-02-08-140500-drop-deadcode': _20220208140500dropdeadcode,
	'2022-02-08-144400-dynamic-stage-schema': _20220208144400dynamicstageschema,
	'2022-10-03-110000-table-on-delete': _20221003110000tableondelete,
	'2023-09-11-174000-fix-on-delete': _20230911174000fixondelete,
	'2023-10-19-173000-fix-unique': _20231019173000fixunique,
	'2023-10-24-140000-schema-nullable-checksum': _20231024140000schemanullablechecksum,
	'2024-06-28-150000-migrations-drop-sequence': _20240628150000migrationsdropsequence,
	'2024-06-28-153000-schema': _20240628153000schema,
	'2024-06-28-153001-schema-init': _20240628153001schemainit,
	'2024-07-29-150000-event-data-index': _20240729150000eventdataindex,
	'2025-03-14-110000-fix-missing-index': _20250314110000fixmissingindex,
}


export class SystemMigrationsRunner {
	constructor(
		private readonly databaseContextFactory: DatabaseContextFactory,
		private readonly project: ProjectConfig & { db: DatabaseConfig },
		private readonly schemaProvider: SchemaProvider,
		private readonly migrationGroups: Record<string, MigrationGroup<unknown>>,
		private readonly databaseMetadataResolver: DatabaseMetadataResolver,
	) {
	}
	async run(logger: Logger) {
		await createDatabaseIfNotExists(this.project.db, message => typeof message === 'string' ? logger.warn(message) : logger.error(message))
		const singleConnection = Connection.createSingle(this.project.db, err => logger.error(err))
		await singleConnection.scope(async connection => {
			const schemaResolver = async (connection: Connection.ConnectionLike) => {
				const dbContextMigrations = this.databaseContextFactory.create(connection)
				return await this.schemaProvider.buildSchemaFromMigrations(dbContextMigrations)
			}
			const migrationResolver = new GroupMigrationsResolver(
				new SnapshotMigrationResolver(snapshot, migrations),
				Object.fromEntries(Object.entries(this.migrationGroups).map(
					([group, it]) => [
						group,
						new SnapshotMigrationResolver(
							it.snapshot,
							it.migrations,
							group.replace(/[^-_\w]+/g, '-'),
							migrations,
						),
					]),
				),
			)
			const migrationsRunner = new DbMigrationsRunner(connection, this.project.systemSchema, migrationResolver)
			await migrationsRunner.migrate(message => logger.warn(message), {
				project: this.project,
				schemaResolver,
				databaseMetadataResolver: (connection: Connection.ConnectionLike, schema: string) => {
					const dbContextMigrations = this.databaseContextFactory.create(connection)
					return this.databaseMetadataResolver.resolveMetadata(dbContextMigrations.client, schema)
				},

			})
		})
		await singleConnection.end()
	}
}
