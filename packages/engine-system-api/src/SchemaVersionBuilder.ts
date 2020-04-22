import { Schema } from '@contember/schema'
import { SchemaMigrator } from '@contember/schema-migrations'
import { ExecutedMigrationsResolver } from './model/migrations/ExecutedMigrationsResolver'
import { emptySchema } from '@contember/schema-utils'
import { DatabaseContext } from './model/database/DatabaseContext'

export type VersionedSchema = Schema & { version: string }

export class SchemaVersionBuilder {
	constructor(
		private readonly executedMigrationsResolver: ExecutedMigrationsResolver,
		private readonly schemaMigrator: SchemaMigrator,
	) {}

	async buildSchemaForStage(db: DatabaseContext, stageSlug: string, after?: VersionedSchema): Promise<VersionedSchema> {
		const schema = await this.buildSchema(db, after)
		if (schema === after) {
			return schema
		}
		return this.filterSchemaByStage(schema, stageSlug)
	}

	async buildSchema(db: DatabaseContext, after?: VersionedSchema): Promise<VersionedSchema> {
		return (await this.executedMigrationsResolver.getMigrations(db, after?.version)).reduce(
			(schema, migr) => ({
				...this.schemaMigrator.applyModifications(schema, migr.modifications, migr.formatVersion),
				version: migr.version,
			}),
			after || { ...emptySchema, version: '' },
		)
	}

	private filterSchemaByStage(schema: VersionedSchema, stageSlug: string) {
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
}
