import { Schema } from '@contember/schema'
import { SchemaMigrator } from '@contember/schema-migrations'
import { ExecutedMigrationsResolver } from './model/migrations/ExecutedMigrationsResolver'
import { emptySchema } from '@contember/schema-utils'

export class SchemaVersionBuilder {
	constructor(
		private readonly executedMigrationsResolver: ExecutedMigrationsResolver,
		private readonly schemaMigrator: SchemaMigrator,
	) {}

	async buildSchemaForStage(stageSlug: string): Promise<Schema> {
		const schema = await this.buildSchema()

		return {
			...schema,
			acl: {
				...schema.acl,
				roles: Object.fromEntries(
					Object.entries(schema.acl.roles).filter(
						([key, value]) =>
							value.stages === '*' || !!value.stages.find(pattern => !!new RegExp(pattern).exec(stageSlug)),
					),
				),
			},
		}
	}

	async buildSchema(): Promise<Schema> {
		return (await this.executedMigrationsResolver.getMigrations()).reduce(
			(schema, migr) => this.schemaMigrator.applyModifications(schema, migr.modifications, migr.formatVersion),
			emptySchema,
		)
	}
}
