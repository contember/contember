import { MigrationFilesManager } from './MigrationFilesManager'
import { Schema } from '@contember/schema'
import { Migration, SchemaDiffer, VERSION_LATEST } from '@contember/schema-migrations'
import { MigrationVersionHelper } from '@contember/engine-common'

export class MigrationCreator {
	constructor(
		private readonly migrationFilesManager: MigrationFilesManager,
		private readonly schemaDiffer: SchemaDiffer,
		private readonly emptyTemplates: Record<string, string> = {},
	) {}

	async createEmptyMigrationFile(migrationName: string, format: string): Promise<string> {
		if (!this.emptyTemplates.hasOwnProperty(format)) {
			throw new Error(`Unknown format ${format}`)
		}
		await this.migrationFilesManager.createDirIfNotExist()
		const [, fullName] = MigrationVersionHelper.createVersion(migrationName)
		const filename = await this.migrationFilesManager.createFile(this.emptyTemplates[format], fullName, format)

		return filename
	}

	async prepareMigration(
		initialSchema: Schema,
		newSchema: Schema,
		migrationName: string,
		{ skipInitialSchemaValidation = false }: { skipInitialSchemaValidation?: boolean } = {},
	): Promise<{ migration: Migration; initialSchema: Schema } | null> {
		await this.migrationFilesManager.createDirIfNotExist()

		const modifications = this.schemaDiffer.diffSchemas(initialSchema, newSchema, { skipInitialSchemaValidation })
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
