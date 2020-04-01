import StageTree from '../stages/StageTree'
import { Migration, Modification, ModificationHandlerFactory } from '@contember/schema-migrations'
import { createMigrationBuilder } from '@contember/database-migrations'
import { Client, DatabaseQueryable, wrapIdentifier } from '@contember/database'
import StageCommonEventsMatrixQuery from '../queries/StageCommonEventsMatrixQuery'
import { formatSchemaName } from '../helpers'
import { Schema } from '@contember/schema'
import CreateEventCommand from '../commands/CreateEventCommand'
import { ContentEvent, EventType } from '@contember/engine-common'
import { Stage, StageWithoutEvent } from '../dtos/Stage'
import { QueryHandler } from '@contember/queryable'
import { DiffQuery } from '../queries'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import RecreateContentEvent from '../commands/RecreateContentEvent'
import { UuidProvider } from '../../utils/uuid'
import { assertEveryIsContentEvent } from '../events/eventUtils'
import { SaveMigrationCommand } from '../commands/SaveMigrationCommand'
import RebaseExecutor from '../events/RebaseExecutor'
import { SchemaVersionBuilder } from '../../SchemaVersionBuilder'
import { DatabaseContext } from '../database/DatabaseContext'
import { VERSION_INITIAL } from '@contember/schema-migrations/dist/src/modifications/ModificationVersions'

type StageEventsMap = Record<string, ContentEvent[]>

export default class ProjectMigrator {
	constructor(
		private readonly stageTree: StageTree,
		private readonly modificationHandlerFactory: ModificationHandlerFactory,
		private readonly rebaseExecutor: RebaseExecutor,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async migrate(db: DatabaseContext, migrationsToExecute: Migration[], progressCb: (version: string) => void) {
		let schema = await this.schemaVersionBuilder.buildSchema(db)

		await this.rebaseExecutor.rebaseAll(db)
		const rootStage = this.stageTree.getRoot()
		const commonEventsMatrix = await db.queryHandler.fetch(new StageCommonEventsMatrixQuery())
		let stageEvents = await this.fetchStageEvents(db.queryHandler, commonEventsMatrix, rootStage)

		let previousId = commonEventsMatrix[rootStage.slug][rootStage.slug].stageAEventId
		for (const migration of migrationsToExecute) {
			progressCb(migration.version)
			const formatVersion = migration.formatVersion

			for (const modification of migration.modifications) {
				;[schema, stageEvents] = await this.applyModification(
					db.client,
					schema,
					stageEvents,
					modification,
					formatVersion,
				)
			}

			previousId = await db.commandBus.execute(
				new CreateEventCommand(
					EventType.runMigration,
					{
						version: migration.version,
					},
					previousId,
				),
			)
			await db.commandBus.execute(new SaveMigrationCommand(migration))
		}

		await db.commandBus.execute(new UpdateStageEventCommand(rootStage.slug, previousId))

		await this.reCreateEvents(db, { ...rootStage, event_id: previousId }, stageEvents)
	}

	private async applyModification(
		db: Client,
		schema: Schema,
		events: StageEventsMap,
		modification: Migration.Modification,
		formatVersion: number,
	): Promise<[Schema, StageEventsMap]> {
		const stage = this.stageTree.getRoot()
		const builder = createMigrationBuilder()
		const modificationHandler = this.modificationHandlerFactory.create(
			modification.modification,
			modification,
			schema,
			formatVersion,
		)
		await modificationHandler.createSql(builder)
		const sql = builder.getSql()
		await this.executeOnStage(db, stage, sql)

		const newEvents = await this.applyOnChildren(db, stage, modificationHandler, events, sql)

		schema = modificationHandler.getSchemaUpdater()(schema)

		return [schema, newEvents]
	}

	private async applyOnChildren(
		db: Client,
		stage: StageWithoutEvent,
		modificationHandler: Modification<any>,
		events: StageEventsMap,
		sql: string,
	): Promise<StageEventsMap> {
		for (const childStage of this.stageTree.getChildren(stage)) {
			const stageEvents = events[childStage.slug]

			const transformedEvents = await modificationHandler.transformEvents(stageEvents)
			if (stageEvents !== transformedEvents) {
				events = { ...events, [childStage.slug]: transformedEvents }
			}
			await this.executeOnStage(db, childStage, sql)
			events = await this.applyOnChildren(db, childStage, modificationHandler, events, sql)
		}
		return events
	}

	private async executeOnStage(db: Client, stage: StageWithoutEvent, sql: string) {
		await db.query('SET search_path TO ' + wrapIdentifier(formatSchemaName(stage)))
		await db.query(sql)
	}

	private async fetchStageEvents(
		queryHandler: QueryHandler<DatabaseQueryable>,
		eventsMatrix: StageCommonEventsMatrixQuery.Result,
		stage: StageWithoutEvent,
	): Promise<StageEventsMap> {
		let result: StageEventsMap = {}
		for (const child of this.stageTree.getChildren(stage)) {
			const info = eventsMatrix[stage.slug][child.slug]
			if (info.distance !== 0) {
				throw new Error('Not rebased')
			}
			const events =
				eventsMatrix[child.slug][stage.slug].distance > 0
					? await queryHandler.fetch(new DiffQuery(info.commonEventId, info.stageBEventId))
					: []
			assertEveryIsContentEvent(events)

			result = {
				...result,
				[child.slug]: events,
				...(await this.fetchStageEvents(queryHandler, eventsMatrix, child)),
			}
		}
		return result
	}

	private async reCreateEvents(db: DatabaseContext, stage: Stage, events: StageEventsMap): Promise<void> {
		for (const childStage of this.stageTree.getChildren(stage)) {
			let previousId = stage.event_id
			const transactionContext = new RecreateContentEvent.TransactionContext()
			for (const event of events[childStage.slug]) {
				previousId = await db.commandBus.execute(new RecreateContentEvent(event, previousId, transactionContext))
			}
			await db.commandBus.execute(new UpdateStageEventCommand(childStage.slug, previousId))
			await this.reCreateEvents(db, { ...childStage, event_id: previousId }, events)
		}
	}
}
