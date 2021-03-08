import { Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { SchemaMigrator } from './SchemaMigrator'
import { MigrationsResolver } from './MigrationsResolver'

export class SchemaVersionBuilder {
	constructor(
		private readonly migrationsResolver: MigrationsResolver,
		private readonly schemaMigrator: SchemaMigrator,
	) {}

	async buildSchema(targetVersion?: string): Promise<Schema> {
		return this.buildSchemaAdvanced(emptySchema, version => !targetVersion || version <= targetVersion)
	}

	async buildSchemaUntil(targetVersion: string): Promise<Schema> {
		return this.buildSchemaAdvanced(emptySchema, version => version < targetVersion)
	}

	async continue(schema: Schema, previousVersion: string | null, targetVersion: string): Promise<Schema> {
		return this.buildSchemaAdvanced(schema, version => version <= targetVersion && version > (previousVersion || ''))
	}

	public async buildSchemaAdvanced(initialSchema: Schema, condition: (version: string) => boolean): Promise<Schema> {
		return (await this.migrationsResolver.getMigrations())
			.filter(({ version }) => condition(version))
			.reduce<Schema>(
				(schema, { modifications, formatVersion }) =>
					this.schemaMigrator.applyModifications(schema, modifications, formatVersion),
				initialSchema,
			)
	}
}
