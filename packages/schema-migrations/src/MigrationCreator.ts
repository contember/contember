import { MigrationFilesManager } from './MigrationFilesManager'
import { Schema } from '@contember/schema'
import { SchemaDiffer } from './SchemaDiffer'
import { VERSION_LATEST } from './modifications/ModificationVersions'
import { Migration } from './Migration'
import { MigrationVersionHelper } from '@contember/engine-common'

export class MigrationCreator {
	constructor(
		private readonly migrationFilesManager: MigrationFilesManager,
		private readonly schemaDiffer: SchemaDiffer,
	) {}

	async prepareMigration(
		initialSchema: Schema,
		newSchema: Schema,
		migrationName: string,
	): Promise<{ migration: Migration; initialSchema: Schema } | null> {
		await this.migrationFilesManager.createDirIfNotExist()

		const modifications = this.schemaDiffer.diffSchemas(initialSchema, newSchema)
		if (modifications.length === 0) {
			return null
		}

		const migration = this.createMigration(modifications, migrationName)

		return { initialSchema, migration }
	}

	async saveMigration(migration: Migration): Promise<string> {
		const jsonDiff = MigrationCreator.createContent(migration)
		const filename = await this.migrationFilesManager.createFile(jsonDiff, migration.name)
		return filename
	}

	async removeMigration(name: string): Promise<void> {
		await this.migrationFilesManager.removeFile(name)
	}

	private createMigration(modifications: Migration.Modification[], name: string): Migration {
		const [version, fullName] = MigrationVersionHelper.createVersion(name)
		return { formatVersion: VERSION_LATEST, modifications, version, name: fullName }
	}

	public static createContent({ modifications, formatVersion }: Migration): string {
		return JSON.stringify({ formatVersion, modifications }, undefined, '\t') + '\n'
	}
}
