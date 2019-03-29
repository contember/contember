import { Stage } from '../dtos/Stage'
import CreateEventCommand from '../commands/CreateEventCommand'
import { EventType } from '../EventType'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import { formatSchemaName } from '../helpers/stageHelpers'
import Migration from './Migration'
import { createMigrationBuilder } from '../../../content-api/sqlSchema/sqlSchemaBuilderHelper'
import ModificationHandlerFactory from './modifications/ModificationHandlerFactory'
import SchemaVersionBuilder from '../../../content-schema/SchemaVersionBuilder'

class MigrationExecutor {
	constructor(
		private readonly modificationHandlerFactory: ModificationHandlerFactory,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {
	}

	public async execute(
		db: KnexWrapper,
		stage: Stage,
		migrations: Migration[],
		progressCb: (version: string) => void
	): Promise<void> {
		if (migrations.length === 0) {
			return
		}
		let schema = await this.schemaVersionBuilder.buildSchemaUntil(migrations[0].version)
		await db.raw('SET search_path TO ??', formatSchemaName(stage))

		let previousId = stage.event_id
		for (const { version, modifications } of migrations) {
			progressCb(version)

			const builder = createMigrationBuilder()

			for (let { modification, ...data } of modifications) {
				const modificationHandler = this.modificationHandlerFactory.create(modification, data, schema)
				modificationHandler.createSql(builder)
				schema = modificationHandler.getSchemaUpdater()(schema)
			}

			const sql = builder.getSql()

			await db.raw(sql)
			previousId = await new CreateEventCommand(
				EventType.runMigration,
				{
					version,
				},
				previousId
			).execute(db)
		}

		await new UpdateStageEventCommand(stage.id, previousId).execute(db)
	}
}

export default MigrationExecutor
