import { Schema } from 'cms-common'
import SchemaMigrator from './differ/SchemaMigrator'
import FileNameHelper from '../migrations/FileNameHelper'
import QueryHandler from '../core/query/QueryHandler'
import KnexQueryable from '../core/knex/KnexQueryable'
import LatestMigrationByStageQuery from '../system-api/model/queries/LatestMigrationByStageQuery'
import LatestMigrationByEventQuery from '../system-api/model/queries/LatestMigrationByEventQuery'
import { tuple } from '../utils/tuple'
import { emptySchema } from './schemaUtils'
import Migration from '../system-api/model/migrations/Migration'

class SchemaVersionBuilder {
	constructor(
		private readonly queryHandler: QueryHandler<KnexQueryable>,
		private readonly migrations: Promise<Migration[]>,
		private readonly schemaMigrator: SchemaMigrator,
	) {
	}

	async buildSchemaForStage(stageId: string): Promise<Schema> {
		const currentMigration = await this.queryHandler.fetch(new LatestMigrationByStageQuery(stageId))
		const currentVersion = currentMigration ? currentMigration.data.version : null
		if (!currentVersion) {
			return emptySchema
		}

		return await this.buildSchema(currentVersion)
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
		return (await this.migrations)
			.filter(({ version }) => !targetVersion || version <= targetVersion)
			.map(({ modifications }) => modifications)
			.reduce<Schema>((schema, modifications) => this.schemaMigrator.applyDiff(schema, modifications), emptySchema)
	}

	async continue(schema: Schema, previousVersion: string | null, targetVersion: string): Promise<Schema> {
		return (await this.migrations)
			.filter(({ version }) => version <= targetVersion && version > (previousVersion || ''))
			.map(({ modifications }) => modifications)
			.reduce<Schema>((schema, modifications) => this.schemaMigrator.applyDiff(schema, modifications), schema)
	}
}

export default SchemaVersionBuilder
