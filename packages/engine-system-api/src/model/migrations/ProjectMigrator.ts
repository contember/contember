import { createStageTree, StageTree } from '../stages/StageTree'
import { Migration, MigrationDescriber, Modification } from '@contember/schema-migrations'
import { Client, ConnectionError, DatabaseQueryable, wrapIdentifier } from '@contember/database'
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
import { assertEveryIsContentEvent } from '../events/eventUtils'
import { SaveMigrationCommand } from '../commands/SaveMigrationCommand'
import RebaseExecutor from '../events/RebaseExecutor'
import { SchemaVersionBuilder } from '../../SchemaVersionBuilder'
import { DatabaseContext } from '../database/DatabaseContext'
import { ExecutedMigrationsResolver } from './ExecutedMigrationsResolver'
import { MigrateErrorCode } from '../../schema'
import { ProjectConfig } from '../../types'

type StageEventsMap = Record<string, ContentEvent[]>

export default class ProjectMigrator {
	constructor(
		private readonly migrationDescriber: MigrationDescriber,
		private readonly rebaseExecutor: RebaseExecutor,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly executedMigrationsResolver: ExecutedMigrationsResolver,
	) {}

	public async migrate(
		db: DatabaseContext,
		project: ProjectConfig,
		migrationsToExecute: Migration[],
		progressCb: (version: string) => void,
	) {
		const stageTree = createStageTree(project)
		if (migrationsToExecute.length === 0) {
			return
		}
		let { version, ...schema } = await this.schemaVersionBuilder.buildSchema(db)
		await this.validateMigrations(db, schema, version, migrationsToExecute)

		const sorted = [...migrationsToExecute].sort((a, b) => a.version.localeCompare(b.version))

		await this.rebaseExecutor.rebaseAll(db, project)
		const rootStage = stageTree.getRoot()
		const commonEventsMatrix = await db.queryHandler.fetch(new StageCommonEventsMatrixQuery())
		let stageEvents = await this.fetchStageEvents(db.queryHandler, stageTree, commonEventsMatrix, rootStage)

		let previousId = commonEventsMatrix[rootStage.slug][rootStage.slug].stageAEventId
		for (const migration of sorted) {
			progressCb(migration.version)
			const formatVersion = migration.formatVersion

			for (const modification of migration.modifications) {
				;[schema, stageEvents] = await this.applyModification(
					db.client,
					stageTree,
					schema,
					stageEvents,
					modification,
					formatVersion,
					migration.version,
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

		await this.reCreateEvents(db, stageTree, { ...rootStage, event_id: previousId }, stageEvents)
	}

	private async validateMigrations(
		db: DatabaseContext,
		schema: Schema,
		version: string,
		migrationsToExecute: Migration[],
	) {
		const executedMigrations = await this.executedMigrationsResolver.getMigrations(db)
		for (const migration of migrationsToExecute) {
			if (executedMigrations.find(it => it.version === migration.version)) {
				throw new AlreadyExecutedMigrationError(migration.version, `Migration is already executed`)
			}
			if (migration.version < version) {
				throw new MustFollowLatestMigrationError(migration.version, `Must follow latest executed migration ${version}`)
			}
			const described = await this.migrationDescriber.describeModifications(schema, migration)
			if (described.length === 0) {
				continue
			}
			const latestModification = described[described.length - 1]
			schema = latestModification.schema
			if (latestModification.errors.length > 0) {
				throw new InvalidSchemaError(
					migration.version,
					'Migration generates invalid schema: \n' +
						latestModification.errors.map(it => it.path.join('.') + ': ' + it.message).join('\n'),
				)
			}
		}
	}

	private async applyModification(
		db: Client,
		stageTree: StageTree,
		schema: Schema,
		events: StageEventsMap,
		modification: Migration.Modification,
		formatVersion: number,
		migrationVersion: string,
	): Promise<[Schema, StageEventsMap]> {
		const stage = stageTree.getRoot()
		const { sql, schema: newSchema, handler } = await this.migrationDescriber.describeModification(
			schema,
			modification,
			formatVersion,
		)
		await this.executeOnStage(db, stage, sql, migrationVersion)

		const newEvents = await this.applyOnChildren(db, stageTree, stage, handler, events, sql, migrationVersion)
		return [newSchema, newEvents]
	}

	private async applyOnChildren(
		db: Client,
		stageTree: StageTree,
		stage: StageWithoutEvent,
		modificationHandler: Modification<any>,
		events: StageEventsMap,
		sql: string,
		migrationVersion: string,
	): Promise<StageEventsMap> {
		for (const childStage of stageTree.getChildren(stage)) {
			const stageEvents = events[childStage.slug]

			try {
				const transformedEvents = await modificationHandler.transformEvents(stageEvents)
				if (stageEvents !== transformedEvents) {
					events = { ...events, [childStage.slug]: transformedEvents }
				}
			} catch (e) {
				console.error(e)
				throw new MigrationFailedError(migrationVersion, e.message)
			}
			await this.executeOnStage(db, childStage, sql, migrationVersion)
			events = await this.applyOnChildren(db, stageTree, childStage, modificationHandler, events, sql, migrationVersion)
		}
		return events
	}

	private async executeOnStage(db: Client, stage: StageWithoutEvent, sql: string, migrationVersion: string) {
		await db.query('SET search_path TO ' + wrapIdentifier(formatSchemaName(stage)))
		try {
			await db.query(sql)
		} catch (e) {
			if (e instanceof ConnectionError) {
				console.error(e)
				throw new MigrationFailedError(migrationVersion, e.message)
			}
			throw e
		}
	}

	private async fetchStageEvents(
		queryHandler: QueryHandler<DatabaseQueryable>,
		stageTree: StageTree,
		eventsMatrix: StageCommonEventsMatrixQuery.Result,
		stage: StageWithoutEvent,
	): Promise<StageEventsMap> {
		let result: StageEventsMap = {}
		for (const child of stageTree.getChildren(stage)) {
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
				...(await this.fetchStageEvents(queryHandler, stageTree, eventsMatrix, child)),
			}
		}
		return result
	}

	private async reCreateEvents(
		db: DatabaseContext,
		stageTree: StageTree,
		stage: Stage,
		events: StageEventsMap,
	): Promise<void> {
		for (const childStage of stageTree.getChildren(stage)) {
			let previousId = stage.event_id
			const transactionContext = new RecreateContentEvent.TransactionContext()
			for (const event of events[childStage.slug]) {
				previousId = await db.commandBus.execute(new RecreateContentEvent(event, previousId, transactionContext))
			}
			await db.commandBus.execute(new UpdateStageEventCommand(childStage.slug, previousId))
			await this.reCreateEvents(db, stageTree, { ...childStage, event_id: previousId }, events)
		}
	}
}

export abstract class MigrationError extends Error {
	public abstract code: MigrateErrorCode

	constructor(public readonly version: string, public readonly migrationError: string) {
		super(`${version}: ${migrationError}`)
	}
}

export class MustFollowLatestMigrationError extends MigrationError {
	code = MigrateErrorCode.MustFollowLatest
}

export class AlreadyExecutedMigrationError extends MigrationError {
	code = MigrateErrorCode.AlreadyExecuted
}

export class MigrationFailedError extends MigrationError {
	code = MigrateErrorCode.MigrationFailed
}

export class InvalidSchemaError extends MigrationError {
	code = MigrateErrorCode.InvalidSchema
}
