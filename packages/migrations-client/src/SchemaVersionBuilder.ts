import { Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { Migration, SchemaMigrator } from '@contember/schema-migrations'
import { MigrationsResolver } from './MigrationsResolver.js'
import { SchemaStateManager } from './SchemaStateManager.js'

export class SchemaVersionBuilder {
	private lastBuildUntil: { migrations: Migration[]; schema: Schema } | null = null

	constructor(
		private readonly migrationsResolver: MigrationsResolver,
		private readonly schemaMigrator: SchemaMigrator,
		private readonly schemaStateManager: SchemaStateManager,
	) {}

	async buildSchema(targetVersion?: string): Promise<Schema> {
		let schema = await this.buildSchemaAdvanced(emptySchema, version => !targetVersion || version <= targetVersion)
		if (!targetVersion && await this.schemaStateManager.isStateMode()) {
			const state = await this.schemaStateManager.readState()
			schema = { ...schema, ...state }
		}
		return schema
	}

	/**
	 * Content migrations call this once each, with ascending versions. Continuing from the previous
	 * build keeps a run linear instead of replaying every schema migration from scratch each time.
	 */
	async buildSchemaUntil(targetVersion: string): Promise<Schema> {
		const migrations = (await this.migrationsResolver.getSchemaMigrations()).filter(({ version }) => version < targetVersion)
		const previous = this.lastBuildUntil
		const canContinue = previous !== null
			&& previous.migrations.length <= migrations.length
			&& previous.migrations.every((migration, index) => migration === migrations[index])
		const start = canContinue ? previous : { migrations: [], schema: emptySchema }

		const schema = this.applyMigrations(start.schema, migrations.slice(start.migrations.length))
		this.lastBuildUntil = { migrations, schema }
		return schema
	}

	async continue(schema: Schema, previousVersion: string | null, targetVersion: string): Promise<Schema> {
		return this.buildSchemaAdvanced(schema, version => version <= targetVersion && version > (previousVersion || ''))
	}

	public async buildSchemaAdvanced(initialSchema: Schema, condition: (version: string) => boolean): Promise<Schema> {
		const migrations = (await this.migrationsResolver.getSchemaMigrations()).filter(({ version }) => condition(version))
		return this.applyMigrations(initialSchema, migrations)
	}

	private applyMigrations(initialSchema: Schema, migrations: Migration[]): Schema {
		return migrations.reduce<Schema>(
			(schema, { modifications, formatVersion }) => this.schemaMigrator.applyModifications(schema, modifications, formatVersion),
			initialSchema,
		)
	}
}
