import { MigrationFilesManager } from './MigrationFilesManager'
import { Schema } from '@contember/schema'
import { SchemaVersionBuilder } from './SchemaVersionBuilder'
import { SchemaDiffer } from './SchemaDiffer'
import { VERSION_LATEST } from './modifications/ModificationVersions'
import Migration from './Migration'
import { MigrationVersionHelper } from './MigrationVersionHelper'

export class MigrationCreator {
	constructor(
		private readonly migrationFilesManager: MigrationFilesManager,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly schemaDiffer: SchemaDiffer,
	) {}

	async createEmpty(migrationName: string): Promise<string> {
		await this.migrationFilesManager.createDirIfNotExist()
		const jsonDiff = MigrationCreator.createContent([])

		const version = MigrationVersionHelper.createVersion(migrationName)
		return await this.migrationFilesManager.createFile(jsonDiff, version, 'json')
	}

	async createDiff(
		newSchema: Schema,
		migrationName: string,
	): Promise<{ migration: Migration; filename: string; initialSchema: Schema } | null> {
		await this.migrationFilesManager.createDirIfNotExist()

		const initialSchema = await this.schemaVersionBuilder.buildSchema()

		const modifications = this.schemaDiffer.diffSchemas(initialSchema, newSchema)
		if (modifications.length === 0) {
			return null
		}

		const jsonDiff = MigrationCreator.createContent(modifications)
		const version = MigrationVersionHelper.createVersion(migrationName)
		const migration: Migration = { formatVersion: VERSION_LATEST, modifications, version }

		const filename = await this.migrationFilesManager.createFile(jsonDiff, version, 'json')
		return { filename, initialSchema, migration }
	}

	public static createContent(modifications: Migration.Modification[]): string {
		return JSON.stringify({ formatVersion: VERSION_LATEST, modifications }, undefined, '\t') + '\n'
	}
}
