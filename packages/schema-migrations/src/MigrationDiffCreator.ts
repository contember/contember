import { MigrationFilesManager } from '@contember/engine-common'
import { Schema } from '@contember/schema'
import { SchemaVersionBuilder } from './SchemaVersionBuilder'
import { SchemaDiffer } from './SchemaDiffer'
import { VERSION_LATEST } from './modifications/ModificationVersions'

export class MigrationDiffCreator {
	constructor(
		private readonly migrationFilesManager: MigrationFilesManager,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly schemaDiffer: SchemaDiffer,
	) {}

	async createDiff(newSchema: Schema, migrationName: string): Promise<string | null> {
		await this.migrationFilesManager.createDirIfNotExist()

		const currentSchema = await this.schemaVersionBuilder.buildSchema()

		const modifications = this.schemaDiffer.diffSchemas(currentSchema, newSchema)
		if (modifications.length === 0) {
			return null
		}

		const jsonDiff = JSON.stringify({ formatVersion: VERSION_LATEST, modifications }, undefined, '\t')

		return await this.migrationFilesManager.createFile(jsonDiff, migrationName, 'json')
	}
}
