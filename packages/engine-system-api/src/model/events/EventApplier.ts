import { AnyEvent, CreateEvent, DeleteEvent, EventType, RunMigrationEvent, UpdateEvent } from '@contember/engine-common'
import { Stage } from '../dtos'
import { assertNever, ImplementationException } from '../../utils'
import { DeleteBuilder, InsertBuilder, UpdateBuilder } from '@contember/database'
import { formatSchemaName, getJunctionTables } from '../helpers'
import { ExecutedMigrationsResolver, MigrationExecutor } from '../migrations'
import { StageBySlugQuery } from '../queries'
import { Schema } from '@contember/schema'
import { DatabaseContext } from '../database'
import assert from 'assert'

type TablesPrimaryColumns = Record<string, string[]>

const buildPrimaryMap = (primaryColumns: string[], ids: string[]): Record<string, string> => {
	assert.equal(primaryColumns.length, ids.length)
	return Object.fromEntries(primaryColumns.map((col, index) => [col, ids[index]]))
}

export class EventApplier {
	constructor(
		private readonly migrationExecutor: MigrationExecutor,
		private readonly executedMigrationsResolver: ExecutedMigrationsResolver,
	) {}

	public async applyEvents(db: DatabaseContext, stage: Stage, events: AnyEvent[], schema: Schema): Promise<void> {
		let primaryColumns: TablesPrimaryColumns = {}
		const buildPrimaryColumns = () => {
			primaryColumns = {}
			for (const entity of Object.values(schema.model.entities)) {
				primaryColumns[entity.tableName] = [entity.primaryColumn]
			}
			for (const junction of getJunctionTables(schema.model)) {
				primaryColumns[junction.tableName] = [
					junction.joiningColumn.columnName,
					junction.inverseJoiningColumn.columnName,
				]
			}
		}
		buildPrimaryColumns()

		let trxId: string | null = null
		for (let event of events) {
			if (event.transactionId !== trxId) {
				await db.client.query('SET CONSTRAINTS ALL IMMEDIATE')
				await db.client.query('SET CONSTRAINTS ALL DEFERRED')
				trxId = event.transactionId
			}
			const oldSchema = schema
			schema = await this.applyEvent(db, stage, event, schema, primaryColumns)
			if (schema !== oldSchema) {
				buildPrimaryColumns()
			}
		}
		await db.client.query('SET CONSTRAINTS ALL IMMEDIATE')
	}

	private async applyEvent(
		db: DatabaseContext,
		stage: Stage,
		event: AnyEvent,
		schema: Schema,
		primaryColumns: TablesPrimaryColumns,
	): Promise<Schema> {
		switch (event.type) {
			case EventType.create:
				await this.applyCreate(db, stage, event, primaryColumns)
				return schema
			case EventType.update:
				await this.applyUpdate(db, stage, event, primaryColumns)
				return schema
			case EventType.delete:
				await this.applyDelete(db, stage, event, primaryColumns)
				return schema
			case EventType.runMigration:
				return await this.applyRunMigration(db, schema, stage, event)
			default:
				assertNever(event)
		}
	}

	private async applyCreate(
		db: DatabaseContext,
		stage: Stage,
		event: CreateEvent,
		primaryColumns: TablesPrimaryColumns,
	): Promise<void> {
		const primary = buildPrimaryMap(primaryColumns[event.tableName], event.rowId)
		await InsertBuilder.create()
			.into(event.tableName)
			.values({ ...event.values, ...primary })
			.execute(db.client.forSchema(formatSchemaName(stage)))
	}

	private async applyUpdate(
		db: DatabaseContext,
		stage: Stage,
		event: UpdateEvent,
		primaryColumns: TablesPrimaryColumns,
	): Promise<void> {
		if (Object.values(event.values).length === 0) {
			return
		}
		const primary = buildPrimaryMap(primaryColumns[event.tableName], event.rowId)
		await UpdateBuilder.create()
			.table(event.tableName)
			.where(primary)
			.values(event.values)
			.execute(db.client.forSchema(formatSchemaName(stage)))
	}

	private async applyDelete(
		db: DatabaseContext,
		stage: Stage,
		event: DeleteEvent,
		primaryColumns: TablesPrimaryColumns,
	): Promise<void> {
		const primary = buildPrimaryMap(primaryColumns[event.tableName], event.rowId)
		await DeleteBuilder.create()
			.from(event.tableName)
			.where(primary)
			.execute(db.client.forSchema(formatSchemaName(stage)))
	}

	private async applyRunMigration(
		db: DatabaseContext,
		schema: Schema,
		stage: Stage,
		event: RunMigrationEvent,
	): Promise<Schema> {
		const stageRow = await db.queryHandler.fetch(new StageBySlugQuery(stage.slug))
		if (!stageRow) {
			throw new ImplementationException()
		}
		const event_id = stageRow.event_id
		const migration = await this.executedMigrationsResolver.getMigrationByVersion(db, event.version)
		if (!migration) {
			throw new Error(`Migration ${event.version} not found`)
		}
		return await this.migrationExecutor.execute(db, schema, { ...stage, event_id }, migration)
	}
}
