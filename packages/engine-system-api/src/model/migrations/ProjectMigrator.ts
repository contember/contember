import StageTree from '../stages/StageTree'
import {
	createMigrationBuilder,
	Migration,
	Modification,
	ModificationHandlerFactory,
} from '@contember/schema-migrations'
import { Client, DatabaseQueryable, wrapIdentifier } from '@contember/database'
import StageCommonEventsMatrixQuery from '../queries/StageCommonEventsMatrixQuery'
import { SchemaVersionBuilder } from '../../SchemaVersionBuilder'
import { formatSchemaName } from '../helpers/stageHelpers'
import { emptySchema } from '@contember/schema-utils'
import { Schema } from '@contember/schema'
import CreateEventCommand from '../commands/CreateEventCommand'
import { ContentEvent, EventType, isContentEvent } from '@contember/engine-common'
import { Stage, StageWithoutEvent } from '../dtos/Stage'
import { QueryHandler } from '@contember/queryable'
import DiffQuery from '../queries/DiffQuery'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import RecreateContentEvent from '../commands/RecreateContentEvent'
import { UuidProvider } from '../../utils/uuid'
import { VERSION_INITIAL } from '@contember/schema-migrations/dist/src/modifications/ModificationVersions'

type StageEventsMap = Record<string, ContentEvent[]>

export default class ProjectMigrator {
	constructor(
		private readonly db: Client,
		private readonly stageTree: StageTree,
		private readonly modificationHandlerFactory: ModificationHandlerFactory,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly providers: UuidProvider,
	) {}

	public async migrate(
		currentVersion: string | null,
		migrationsToExecute: Migration[],
		progressCb: (version: string) => void,
	) {
		const queryHandler = this.db.createQueryHandler()
		const rootStage = this.stageTree.getRoot()
		const commonEventsMatrix = await queryHandler.fetch(new StageCommonEventsMatrixQuery())
		let schema = currentVersion ? await this.schemaVersionBuilder.buildSchema(currentVersion) : emptySchema
		let stageEvents = await this.fetchStageEvents(queryHandler, commonEventsMatrix, rootStage)

		let previousId = commonEventsMatrix[rootStage.slug][rootStage.slug].stageAEventId
		for (const migration of migrationsToExecute) {
			progressCb(migration.version)
			const formatVersion = migration.formatVersion

			for (const modification of migration.modifications) {
				;[schema, stageEvents] = await this.applyModification(schema, stageEvents, modification, formatVersion)
			}

			previousId = await new CreateEventCommand(
				EventType.runMigration,
				{
					version: migration.version,
				},
				previousId,
				this.providers,
			).execute(this.db)
		}

		await new UpdateStageEventCommand(rootStage.slug, previousId).execute(this.db)

		await this.reCreateEvents(this.db, { ...rootStage, event_id: previousId }, stageEvents)
	}

	private async applyModification(
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
		await this.executeOnStage(stage, sql)

		const newEvents = await this.applyOnChildren(stage, modificationHandler, events, sql)

		schema = modificationHandler.getSchemaUpdater()(schema)

		return [schema, newEvents]
	}

	private async applyOnChildren(
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
			await this.executeOnStage(childStage, sql)
			events = await this.applyOnChildren(childStage, modificationHandler, events, sql)
		}
		return events
	}

	private async executeOnStage(stage: StageWithoutEvent, sql: string) {
		await this.db.query('SET search_path TO ' + wrapIdentifier(formatSchemaName(stage)))
		await this.db.query(sql)
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
			for (const event of events) {
				if (!isContentEvent(event)) {
					throw new Error()
				}
			}
			result = {
				...result,
				[child.slug]: events as ContentEvent[],
				...(await this.fetchStageEvents(queryHandler, eventsMatrix, child)),
			}
		}
		return result
	}

	private async reCreateEvents(db: Client, stage: Stage, events: StageEventsMap): Promise<void> {
		for (const childStage of this.stageTree.getChildren(stage)) {
			let previousId = stage.event_id
			const transactionContext = new RecreateContentEvent.TransactionContext(this.providers)
			for (const event of events[childStage.slug]) {
				previousId = await new RecreateContentEvent(event, previousId, transactionContext, this.providers).execute(db)
			}
			await new UpdateStageEventCommand(childStage.slug, previousId).execute(db)
			await this.reCreateEvents(db, { ...childStage, event_id: previousId }, events)
		}
	}
}
