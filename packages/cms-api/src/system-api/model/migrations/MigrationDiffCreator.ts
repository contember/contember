import MigrationFilesManager from '../../../migrations/MigrationFilesManager'
import SchemaVersionBuilder from '../../../content-schema/SchemaVersionBuilder'
import SchemaDiffer from './SchemaDiffer'
import { Schema } from 'cms-common'

class MigrationDiffCreator {
	constructor(
		private readonly migrationFilesManager: MigrationFilesManager,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly schemaDiffer: SchemaDiffer,
	) {}

	async createDiff(newSchema: Schema, migrationName: string): Promise<string | null> {
		await this.migrationFilesManager.createDirIfNotExist()

		const currentSchema = await this.schemaVersionBuilder.buildSchema()

		const diff = this.schemaDiffer.diffSchemas(currentSchema, newSchema)
		if (diff.length === 0) {
			return null
		}

		const jsonDiff = JSON.stringify({ modifications: diff }, undefined, '\t')

		return await this.migrationFilesManager.createFile(jsonDiff, migrationName, 'json')
	}
}

export default MigrationDiffCreator
