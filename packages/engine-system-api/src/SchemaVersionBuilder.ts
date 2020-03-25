import { Schema } from '@contember/schema'
import { tuple } from './utils'
import { emptySchema } from '@contember/schema-utils'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import LatestMigrationByStageQuery from './model/queries/LatestMigrationByStageQuery'
import LatestMigrationByEventQuery from './model/queries/LatestMigrationByEventQuery'
import { SchemaVersionBuilder as SchemaVersionBuilderInternal } from '@contember/schema-migrations'

export class SchemaVersionBuilder {
	constructor(
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
		private readonly internalBuilder: SchemaVersionBuilderInternal,
	) {}

	async buildSchemaForStage(stageSlug: string): Promise<Schema> {
		const currentMigration = await this.queryHandler.fetch(new LatestMigrationByStageQuery(stageSlug))
		const currentVersion = currentMigration ? currentMigration.data.version : null
		if (!currentVersion) {
			return emptySchema
		}

		const schema = await this.buildSchema(currentVersion)

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

	async buildSchemaForEvent(eventId: string): Promise<[Schema, string | null]> {
		const currentMigration = await this.queryHandler.fetch(new LatestMigrationByEventQuery(eventId))
		const currentVersion = currentMigration ? currentMigration.data.version : null
		if (!currentVersion) {
			return tuple(emptySchema, null)
		}

		return tuple(await this.buildSchema(currentVersion), currentVersion)
	}

	async buildSchema(targetVersion?: string): Promise<Schema> {
		return this.internalBuilder.buildSchema(targetVersion)
	}

	async buildSchemaUntil(targetVersion: string): Promise<Schema> {
		return this.internalBuilder.buildSchemaUntil(targetVersion)
	}
}
