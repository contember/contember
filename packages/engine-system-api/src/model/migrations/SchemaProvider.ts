import { SchemaQuery } from '../queries/index.js'
import { DatabaseContext } from '../database/index.js'
import { calculateSchemaChecksum, emptySchema, normalizeSchema } from '@contember/schema-utils'
import { ExecutedMigrationsResolver } from './ExecutedMigrationsResolver.js'
import { SchemaMigrator } from '@contember/schema-migrations'
import { Schema } from '@contember/schema'

export type SchemaMeta = {
	checksum: string
	version: string
	updatedAt: Date
	id: number
}

export const emptyVersionedSchema: SchemaWithMeta = {
	schema: emptySchema,
	meta: {},
}

export type SchemaWithMeta = {
	schema: Schema
	meta: SchemaMeta | { [K in keyof SchemaMeta]?: undefined }
}

export class SchemaProvider {
	constructor(
		private readonly executedMigrationsResolver: ExecutedMigrationsResolver,
		private readonly schemaMigrator: SchemaMigrator,
	) {
	}

	async buildSchemaFromMigrations(db: DatabaseContext): Promise<SchemaWithMeta> {
		const newMigrations = await this.executedMigrationsResolver.getMigrations(db)

		const partialResult = newMigrations.reduce<SchemaWithMeta>(
			(schema, migration) => {
				return {
					schema: migration.type !== 'schema'
						? schema.schema
						: this.schemaMigrator.applyModifications(schema.schema, migration.modifications, migration.formatVersion),
					meta: {
						version: migration.version,
						id: migration.id,
						updatedAt: migration.executedAt,
						checksum: '',
					},
				}
			},
			emptyVersionedSchema,
		)

		if (!partialResult.meta.version) {
			return emptyVersionedSchema
		}

		return {
			schema: partialResult.schema,
			meta: {
				...partialResult.meta,
				checksum: calculateSchemaChecksum(partialResult.schema),
			},
		}
	}

	public async fetch({ db, currentSchema }: {
		db: DatabaseContext
		currentSchema?: SchemaWithMeta | null
	}): Promise<SchemaWithMeta> {
		const newSchema = await db.queryHandler.fetch(new SchemaQuery(currentSchema?.meta.checksum, currentSchema?.meta.version))
		if (!newSchema) {
			return currentSchema ?? emptyVersionedSchema
		}

		return newSchema
	}
}
