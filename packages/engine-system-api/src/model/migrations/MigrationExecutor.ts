import { EventType } from '@contember/engine-common'
import { Client, wrapIdentifier } from '@contember/database'
import { Schema } from '@contember/schema'
import { Migration, ModificationHandlerFactory } from '@contember/schema-migrations'
import { createMigrationBuilder } from '@contember/database-migrations'
import { Stage } from '../dtos/Stage'
import CreateEventCommand from '../commands/CreateEventCommand'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import { formatSchemaName } from '../helpers/stageHelpers'
import { SchemaVersionBuilder } from '../../SchemaVersionBuilder'
import { UuidProvider } from '../../utils/uuid'

class MigrationExecutor {
	constructor(
		private readonly modificationHandlerFactory: ModificationHandlerFactory,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly providers: UuidProvider,
	) {}

	public async execute(schema: Schema, db: Client, stage: Stage, migration: Migration): Promise<Schema> {
		await db.query('SET search_path TO ' + wrapIdentifier(formatSchemaName(stage)))

		let previousId = stage.event_id

		const builder = createMigrationBuilder()

		for (let { modification, ...data } of migration.modifications) {
			const modificationHandler = this.modificationHandlerFactory.create(
				modification,
				data,
				schema,
				migration.formatVersion,
			)
			await modificationHandler.createSql(builder)
			schema = modificationHandler.getSchemaUpdater()(schema)
		}

		const sql = builder.getSql()

		await db.query(sql)
		previousId = await new CreateEventCommand(
			EventType.runMigration,
			{
				version: migration.version,
			},
			previousId,
			this.providers,
		).execute(db)

		await new UpdateStageEventCommand(stage.slug, previousId).execute(db)
		return schema
	}
}

export default MigrationExecutor
