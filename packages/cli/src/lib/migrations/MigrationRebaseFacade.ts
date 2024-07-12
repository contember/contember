import { Migration, MigrationFilesManager, SchemaVersionBuilder, SystemClient } from '@contember/migrations-client'
import { MigrationsValidator } from './MigrationsValidator'
import { emptySchema } from '@contember/schema-utils'
import { MigrationVersionHelper } from '@contember/engine-common'
import { SystemClientProvider } from '../SystemClientProvider'

export class MigrationRebaseFacade {
	constructor(
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly migrationsValidator: MigrationsValidator,
		private readonly systemClientProvider: SystemClientProvider,
		private readonly migrationFilesManager: MigrationFilesManager,
	) {
	}

	rebase = async (migrations: Migration[]) => {
		const versions = migrations.map(it => it.version)
		const schemaWithoutMigrations = await this.schemaVersionBuilder.buildSchemaAdvanced(
			emptySchema,
			version => !versions.includes(version),
		)
		const valid = await this.migrationsValidator.validate(schemaWithoutMigrations, migrations)
		if (!valid) {
			throw `Cannot rebase migrations`
		}

		let i = 0
		for (const migration of migrations) {
			const name = migration.name.substring(MigrationVersionHelper.prefixLength + 1)
			const [version, fullName] = MigrationVersionHelper.createVersion(name, i++)
			const newMigration = {
				name: fullName,
				version: version,
				formatVersion: migration.formatVersion,
				modifications: migration.modifications,
			}
			await this.systemClientProvider.get().migrationModify(migration.version, newMigration)
			await this.migrationFilesManager.moveFile(migration.name, newMigration.name)
		}
	}
}
