import StageTree from '../stages/StageTree'
import MigrationsResolver from '../../../content-schema/MigrationsResolver'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import StageCommonEventsMatrixQuery from '../queries/StageCommonEventsMatrixQuery'
import SchemaVersionBuilder from '../../../content-schema/SchemaVersionBuilder'
import ModificationHandlerFactory from './modifications/ModificationHandlerFactory'
import { formatSchemaName } from '../helpers/stageHelpers'
import { emptySchema } from '../../../content-schema/schemaUtils'
import { createMigrationBuilder } from '../../../content-api/sqlSchema/sqlSchemaBuilderHelper'
import Migration from './Migration'
import { Schema } from 'cms-common'
import CreateEventCommand from '../commands/CreateEventCommand'
import { EventType, isContentEvent } from '../EventType'
import { Stage, StageWithoutEvent } from '../dtos/Stage'
import { ContentEvent } from '../dtos/Event'
import QueryHandler from '../../../core/query/QueryHandler'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import DiffQuery from '../queries/DiffQuery'
import { Modification } from './modifications/Modification'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import RecreateContentEvent from '../commands/RecreateContentEvent'

type StageEventsMap = Record<string, ContentEvent[]>

export default class ProjectMigrator {

	constructor(
		private readonly db: KnexWrapper,
		private readonly stageTree: StageTree,
		private readonly migrationsResolver: MigrationsResolver,
		private readonly modificationHandlerFactory: ModificationHandlerFactory,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {
	}

	public async migrate(
		currentVersion: string | null,
		migrationsToExecute: Migration[],
		progressCb: (version: string) => void,
	) {
		console.log(migrationsToExecute)
		const queryHandler = this.db.createQueryHandler()
		const rootStage = this.stageTree.getRoot()
		const commonEventsMatrix = await queryHandler.fetch(new StageCommonEventsMatrixQuery())
		let schema = currentVersion ? await this.schemaVersionBuilder.buildSchemaUntil(currentVersion) : emptySchema
		let stageEvents = await this.fetchStageEvents(queryHandler, commonEventsMatrix, rootStage)

		let previousId = commonEventsMatrix[rootStage.id][rootStage.id].stageAEventId
		for (const migration of migrationsToExecute) {
			progressCb(migration.version)

			for (const modification of migration.modifications) {
				[schema, stageEvents] = await this.applyModification(schema, stageEvents, modification)
			}

			previousId = await new CreateEventCommand(
				EventType.runMigration,
				{
					version: migration.version,
				},
				previousId
			).execute(this.db)
		}

		await new UpdateStageEventCommand(rootStage.id, previousId).execute(this.db)

		await this.reCreateEvents(this.db, { ...rootStage, event_id: previousId }, stageEvents)
	}

	private async applyModification(
		schema: Schema,
		events: StageEventsMap,
		modification: Migration.Modification
	): Promise<[Schema, StageEventsMap]> {
		const stage = this.stageTree.getRoot()
		const builder = createMigrationBuilder()
		const modificationHandler = this.modificationHandlerFactory.create(modification.modification, modification, schema)
		await modificationHandler.createSql(builder)
		const sql = builder.getSql()
		await this.executeOnStage(stage, sql)

		const newEvents = await this.applyOnChildren(stage, modificationHandler, events, sql)

		schema = modificationHandler.getSchemaUpdater()(schema)

		return [schema, newEvents]
	}


	private async applyOnChildren(
		stage: StageWithoutEvent,
		modificationHandler: Modification<any>,
		events: StageEventsMap,
		sql: string
	): Promise<StageEventsMap> {

		for (const childStage of this.stageTree.getChildren(stage)) {
			const stageEvents = events[childStage.id]

			const transformedEvents = await modificationHandler.transformEvents(stageEvents)
			if (stageEvents !== transformedEvents) {
				events = { ...events, [childStage.id]: transformedEvents }
			}
			await this.executeOnStage(childStage, sql)
			events = await this.applyOnChildren( childStage, modificationHandler, events, sql)
		}
		return events
	}

	private async executeOnStage(stage: StageWithoutEvent, sql: string) {
		await this.db.raw('SET search_path TO ??', formatSchemaName(stage))
		await this.db.raw(sql)
	}

	private async fetchStageEvents(
		queryHandler: QueryHandler<KnexQueryable>,
		eventsMatrix: StageCommonEventsMatrixQuery.Result,
		stage: StageWithoutEvent
	): Promise<StageEventsMap> {
		let result: StageEventsMap = {}
		for (const child of this.stageTree.getChildren(stage)) {
			const info = eventsMatrix[stage.id][child.id]
			if (info.distance !== 0) {
				throw new Error('Not rebased')
			}
			const events = eventsMatrix[child.id][stage.id].distance > 0 ?
				await queryHandler.fetch(new DiffQuery(info.commonEventId, info.stageBEventId))
				: []
			for (const event of events) {
				if (!isContentEvent(event)) {
					throw new Error()
				}
			}
			result = {
				...result,
				[child.id]: events as ContentEvent[],
				...(await this.fetchStageEvents(queryHandler, eventsMatrix, child))
			}
		}
		return result
	}

	private async reCreateEvents(db: KnexWrapper, stage: Stage, events: StageEventsMap): Promise<void> {
		for (const childStage of this.stageTree.getChildren(stage)) {
			let previousId = stage.event_id
			const transactionContext = new RecreateContentEvent.TransactionContext()
			for (const event of events[childStage.id]) {
				previousId = await (new RecreateContentEvent(event, previousId, transactionContext)).execute(db)
			}
			await new UpdateStageEventCommand(childStage.id, previousId).execute(db)
			await this.reCreateEvents(db, { ...childStage, event_id: previousId }, events)
		}
	}
}
