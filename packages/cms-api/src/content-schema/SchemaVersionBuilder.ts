import { Model } from 'cms-common'
import ProjectSchemaInfo from '../config/ProjectSchemaInfo'
import SchemaMigrator from './differ/SchemaMigrator'
import { emptySchema } from './modelUtils'
import FileNameHelper from '../migrations/FileNameHelper'
import QueryHandler from '../core/query/QueryHandler'
import KnexQueryable from '../core/knex/KnexQueryable'
import LatestMigrationByStageQuery from '../system-api/model/queries/LatestMigrationByStageQuery'
import LatestMigrationByEventQuery from '../system-api/model/queries/LatestMigrationByEventQuery'
import { tuple } from '../utils/tuple'

class SchemaVersionBuilder {
	constructor(
		private readonly queryHandler: QueryHandler<KnexQueryable>,
		private readonly migrations: Promise<ProjectSchemaInfo.Migration[]>
	) {}

	async buildSchemaForStage(stageId: string): Promise<Model.Schema> {
		const currentMigration = await this.queryHandler.fetch(new LatestMigrationByStageQuery(stageId))
		const currentVersion = currentMigration ? FileNameHelper.extractVersion(currentMigration.data.file) : null
		if (!currentVersion) {
			return emptySchema
		}

		return await this.buildSchema(currentVersion)
	}

	async buildSchemaForEvent(eventId: string): Promise<[Model.Schema, string | null]> {
		const currentMigration = await this.queryHandler.fetch(new LatestMigrationByEventQuery(eventId))
		const currentVersion = currentMigration ? FileNameHelper.extractVersion(currentMigration.data.file) : null
		if (!currentVersion) {
			return tuple(emptySchema, null)
		}

		return tuple(await this.buildSchema(currentVersion), currentVersion)
	}

	async buildSchema(targetVersion: string): Promise<Model.Schema> {
		return (await this.migrations)
			.filter(({ version }) => version <= targetVersion)
			.map(({ diff }) => diff)
			.reduce<Model.Schema>((schema, diff) => SchemaMigrator.applyDiff(schema, diff), emptySchema)
	}

	async continue(schema: Model.Schema, previousVersion: string | null, targetVersion: string): Promise<Model.Schema> {
		return (await this.migrations)
			.filter(({ version }) => version <= targetVersion && version > (previousVersion || ''))
			.map(({ diff }) => diff)
			.reduce<Model.Schema>((schema, diff) => SchemaMigrator.applyDiff(schema, diff), schema)
	}
}

export default SchemaVersionBuilder
