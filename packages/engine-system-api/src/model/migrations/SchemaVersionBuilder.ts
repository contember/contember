import { Schema } from '@contember/schema'
import { SchemaMigrator } from '@contember/schema-migrations'
import { emptySchema } from '@contember/schema-utils'
import { ExecutedMigrationsResolver } from './ExecutedMigrationsResolver'
import { DatabaseContext } from '../database'
import { normalizeSchema } from '@contember/schema-utils'

export type VersionedSchema = Schema & { version: string }

export class SchemaVersionBuilder {
	constructor(
		private readonly executedMigrationsResolver: ExecutedMigrationsResolver,
		private readonly schemaMigrator: SchemaMigrator,
	) {}

	async buildSchema(db: DatabaseContext, after?: VersionedSchema): Promise<VersionedSchema> {
		const schema = (await this.executedMigrationsResolver.getMigrations(db, after?.version)).reduce(
			(schema, migr) => ({
				...this.schemaMigrator.applyModifications(schema, migr.modifications, migr.formatVersion),
				version: migr.version,
			}),
			after || { ...emptySchema, version: '' },
		)
		if (schema === after) {
			return schema
		}
		return normalizeSchema(schema)
	}
}
