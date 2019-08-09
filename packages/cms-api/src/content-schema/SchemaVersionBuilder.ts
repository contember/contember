import { Schema } from '@contember/schema'
import SchemaMigrator from './differ/SchemaMigrator'
import QueryHandler from '../core/query/QueryHandler'
import DbQueryable from '../core/database/DbQueryable'
import LatestMigrationByStageQuery from '../system-api/model/queries/LatestMigrationByStageQuery'
import LatestMigrationByEventQuery from '../system-api/model/queries/LatestMigrationByEventQuery'
import { tuple } from '../utils/tuple'
import { emptySchema } from './schemaUtils'
import MigrationsResolver from './MigrationsResolver'

class SchemaVersionBuilder {
	constructor(
		private readonly queryHandler: QueryHandler<DbQueryable>,
		private readonly migrationsResolver: MigrationsResolver,
		private readonly schemaMigrator: SchemaMigrator,
	) {}

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
		return this.doBuild(emptySchema, version => !targetVersion || version <= targetVersion)
	}

	async buildSchemaUntil(targetVersion: string): Promise<Schema> {
		return this.doBuild(emptySchema, version => version < targetVersion)
	}

	async continue(schema: Schema, previousVersion: string | null, targetVersion: string): Promise<Schema> {
		return this.doBuild(schema, version => version <= targetVersion && version > (previousVersion || ''))
	}

	private async doBuild(initialSchema: Schema, condition: (version: string) => boolean): Promise<Schema> {
		return (await this.migrationsResolver.getMigrations())
			.filter(({ version }) => condition(version))
			.map(({ modifications }) => modifications)
			.reduce<Schema>((schema, modifications) => this.schemaMigrator.applyDiff(schema, modifications), initialSchema)
	}
}

export default SchemaVersionBuilder
