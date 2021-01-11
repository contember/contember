import { MigrationFilesManager } from './MigrationFilesManager'
import { Schema } from '@contember/schema'
import { SchemaVersionBuilder } from './SchemaVersionBuilder'
import { SchemaDiffer } from './SchemaDiffer'
import { VERSION_LATEST } from './modifications/ModificationVersions'
import { Migration } from './Migration'
import { MigrationVersionHelper } from './MigrationVersionHelper'

export class MigrationCreator {
	constructor(
		private readonly migrationFilesManager: MigrationFilesManager,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly schemaDiffer: SchemaDiffer,
	) {}

	async createEmpty(migrationName: string): Promise<string> {
		await this.migrationFilesManager.createDirIfNotExist()
		const migration = this.createMigration([], migrationName)
		const jsonDiff = MigrationCreator.createContent(migration)

		return await this.migrationFilesManager.createFile(jsonDiff, migration.version, 'json')
	}

	async prepareDiff(
		newSchema: Schema,
		migrationName: string,
	): Promise<{ migration: Migration; initialSchema: Schema } | null> {
		await this.migrationFilesManager.createDirIfNotExist()

		const initialSchema = await this.schemaVersionBuilder.buildSchema()

		const modifications = this.schemaDiffer.diffSchemas(initialSchema, newSchema)
		if (modifications.length === 0) {
			return null
		}

		const migration = this.createMigration(modifications, migrationName)

		return { initialSchema, migration }
	}

	async saveDiff(migration: Migration): Promise<string> {
		const jsonDiff = MigrationCreator.createContent(migration)
		const filename = await this.migrationFilesManager.createFile(jsonDiff, migration.version, 'json')
		return filename
	}

	private createMigration(modifications: Migration.Modification[], name: string): Migration {
		const version = MigrationVersionHelper.createVersion(name)
		return { formatVersion: VERSION_LATEST, modifications, version, name }
	}

	public static createContent({ modifications, formatVersion }: Migration): string {
		return JSON.stringify({ formatVersion, modifications }, undefined, '\t') + '\n'
	}
}
