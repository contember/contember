import { MigrationsResolver } from './MigrationsResolver'
import { FileNameHelper } from '@contember/engine-common'
import ModificationHandlerFactory from './modifications/ModificationHandlerFactory'
import { SchemaVersionBuilder } from './SchemaVersionBuilder'
import { createMigrationBuilder } from './utils/pgMigrateHelpers'
import { VERSION_INITIAL } from './modifications/ModificationVersions'

export class MigrationSqlDryRunner {
	constructor(
		private readonly migrationsResolver: MigrationsResolver,
		private readonly modificationHandlerFactory: ModificationHandlerFactory,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async getSql(migrationVersion?: string): Promise<string> {
		const migrations = await this.migrationsResolver.getMigrations()
		const migration = migrationVersion
			? migrations.find(
					it => FileNameHelper.extractVersion(it.version) === FileNameHelper.extractVersion(migrationVersion),
			  )
			: migrations[migrations.length - 1]
		if (!migration) {
			throw new Error(`Undefined migration ${migrationVersion}`)
		}
		const builder = createMigrationBuilder()

		let schema = await this.schemaVersionBuilder.buildSchemaUntil(migration.version)
		for (const modification of migration.modifications) {
			const modificationHandler = this.modificationHandlerFactory.create(
				modification.modification,
				modification,
				schema,
				migration.formatVersion,
			)
			await modificationHandler.createSql(builder)
			schema = modificationHandler.getSchemaUpdater()(schema)
		}

		return builder.getSql()
	}
}
