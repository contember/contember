import { EventType } from '@contember/engine-common'
import { wrapIdentifier } from '@contember/database'
import { Schema } from '@contember/schema'
import { Migration, ModificationHandlerFactory } from '@contember/schema-migrations'
import { createMigrationBuilder } from '@contember/database-migrations'
import { Stage } from '../dtos'
import { CreateEventCommand, UpdateStageEventCommand } from '../commands'
import { formatSchemaName } from '../helpers'
import { DatabaseContext } from '../database'

export class MigrationExecutor {
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
