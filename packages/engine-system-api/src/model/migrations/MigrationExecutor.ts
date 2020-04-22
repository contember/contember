import { EventType } from '@contember/engine-common'
import { Client, wrapIdentifier } from '@contember/database'
import { Schema } from '@contember/schema'
import { Migration, ModificationHandlerFactory } from '@contember/schema-migrations'
import { createMigrationBuilder } from '@contember/database-migrations'
import { Stage } from '../dtos/Stage'
import CreateEventCommand from '../commands/CreateEventCommand'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import { formatSchemaName } from '../helpers/stageHelpers'
import { UuidProvider } from '../../utils/uuid'
import { DatabaseContext } from '../database/DatabaseContext'

class MigrationExecutor {
	constructor(private readonly modificationHandlerFactory: ModificationHandlerFactory) {}

	public async execute(db: DatabaseContext, schema: Schema, stage: Stage, migration: Migration): Promise<Schema> {
		await db.client.query('SET search_path TO ' + wrapIdentifier(formatSchemaName(stage)))

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

		await db.client.query(sql)
		previousId = await db.commandBus.execute(
			new CreateEventCommand(
				EventType.runMigration,
				{
					version: migration.version,
				},
				previousId,
			),
		)

		await db.commandBus.execute(new UpdateStageEventCommand(stage.slug, previousId))
		return schema
	}
}

export default MigrationExecutor
