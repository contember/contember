import { Stage } from '../dtos/Stage'
import CreateEventCommand from '../commands/CreateEventCommand'
import { EventType } from '@contember/engine-common'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import { Client } from '@contember/database'
import { formatSchemaName } from '../helpers/stageHelpers'
import { Migration, ModificationHandlerFactory, createMigrationBuilder } from '@contember/schema-migrations'
import { SchemaVersionBuilder } from '../../SchemaVersionBuilder'
import { wrapIdentifier } from '@contember/database'
import { UuidProvider } from '../../utils/uuid'

class MigrationExecutor {
	constructor(
		private readonly modificationHandlerFactory: ModificationHandlerFactory,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly providers: UuidProvider,
	) {}

	public async execute(
		db: Client,
		stage: Stage,
		migrations: Migration[],
		progressCb: (version: string) => void,
	): Promise<Stage> {
		if (migrations.length === 0) {
			return stage
		}
		let schema = await this.schemaVersionBuilder.buildSchemaUntil(migrations[0].version)
		await db.query('SET search_path TO ' + wrapIdentifier(formatSchemaName(stage)))

		let previousId = stage.event_id
		for (const { version, modifications, formatVersion } of migrations) {
			progressCb(version)

			const builder = createMigrationBuilder()

			for (let { modification, ...data } of modifications) {
				const modificationHandler = this.modificationHandlerFactory.create(modification, data, schema, formatVersion)
				await modificationHandler.createSql(builder)
				schema = modificationHandler.getSchemaUpdater()(schema)
			}

			const sql = builder.getSql()

			await db.query(sql)
			previousId = await new CreateEventCommand(
				EventType.runMigration,
				{
					version,
				},
				previousId,
				this.providers,
			).execute(db)
		}

		await new UpdateStageEventCommand(stage.slug, previousId).execute(db)
		return { ...stage, event_id: previousId }
	}
}

export default MigrationExecutor
