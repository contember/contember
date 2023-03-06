import { Schema } from '@contember/schema'
import { SchemaMigrator } from '@contember/schema-migrations'
import { emptySchema } from '@contember/schema-utils'
import { ExecutedMigrationsResolver } from './ExecutedMigrationsResolver'
import { DatabaseContext } from '../database'
import { normalizeSchema } from '@contember/schema-utils'

export type VersionedSchema = Schema & { version: string; id: number; notNormalized: Schema & { version: string; id: number } }

export const emptyVersionedSchema = { ...normalizeSchema(emptySchema), version: '', id: -1, notNormalized: { ...emptySchema, version: '', id: -1 } }

export class SchemaVersionBuilder {
	constructor(
		private readonly executedMigrationsResolver: ExecutedMigrationsResolver,
		private readonly schemaMigrator: SchemaMigrator,
	) {}

	async buildSchema(db: DatabaseContext, after?: VersionedSchema): Promise<VersionedSchema> {
		const newMigrations = (await this.executedMigrationsResolver.getMigrations(db, after?.version))
		if (newMigrations.length === 0) {
			return after ?? emptyVersionedSchema
		}

		const schema = newMigrations.reduce(
			(schema, migration) => ({
				...this.schemaMigrator.applyModifications(schema, migration.modifications, migration.formatVersion),
				version: migration.version,
				id: migration.id,
			}),
			after?.notNormalized ?? emptyVersionedSchema.notNormalized,
		)
		const normalized = normalizeSchema(schema)
		return {
			...normalized,
			notNormalized: schema,
		}
	}
}
