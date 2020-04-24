import {
	AnyEvent,
	ContentEvent,
	CreateEvent,
	DeleteEvent,
	EventType,
	RunMigrationEvent,
	UpdateEvent,
} from '@contember/engine-common'
import { Stage } from '../dtos'
import { assertNever } from '../../utils'
import { DeleteBuilder, InsertBuilder, UpdateBuilder } from '@contember/database'
import { formatSchemaName } from '../helpers'
import { ExecutedMigrationsResolver, MigrationExecutor } from '../migrations'
import { StageBySlugQuery } from '../queries'
import { Schema } from '@contember/schema'
import { DatabaseContext } from '../database'

export class EventApplier {
	constructor(
		private readonly migrationExecutor: MigrationExecutor,
		private readonly executedMigrationsResolver: ExecutedMigrationsResolver,
	) {}

	public async applyEvents(db: DatabaseContext, stage: Stage, events: ContentEvent[]): Promise<void>
	public async applyEvents(db: DatabaseContext, stage: Stage, events: AnyEvent[], schema: Schema): Promise<void>
	public async applyEvents(db: DatabaseContext, stage: Stage, events: AnyEvent[], schema?: Schema): Promise<void> {
		let trxId: string | null = null
		for (let event of events) {
			if (event.transactionId !== trxId) {
				await db.client.query('SET CONSTRAINTS ALL IMMEDIATE')
				await db.client.query('SET CONSTRAINTS ALL DEFERRED')
				trxId = event.transactionId
			}
			if (schema) {
				schema = await this.applyEvent(db, stage, event, schema)
			} else {
				await this.applyEvent(db, stage, event as ContentEvent)
			}
		}
		await db.client.query('SET CONSTRAINTS ALL IMMEDIATE')
	}

	private async applyEvent(db: DatabaseContext, stage: Stage, event: ContentEvent): Promise<undefined>
	private async applyEvent(db: DatabaseContext, stage: Stage, event: AnyEvent, schema: Schema): Promise<Schema>
	private async applyEvent(db: DatabaseContext, stage: Stage, event: AnyEvent, schema?: Schema) {
		switch (event.type) {
			case EventType.create:
				return this.applyCreate(db, stage, event)
			case EventType.update:
				return this.applyUpdate(db, stage, event)
			case EventType.delete:
				return this.applyDelete(db, stage, event)
			case EventType.runMigration:
				return this.applyRunMigration(db, schema!, stage, event)
			default:
				assertNever(event)
		}
	}

	private async applyCreate(db: DatabaseContext, stage: Stage, event: CreateEvent): Promise<void> {
		await InsertBuilder.create()
			.into(event.tableName)
			.values({ ...event.values, id: event.rowId })
			.execute(db.client.forSchema(formatSchemaName(stage)))
	}

	private async applyUpdate(db: DatabaseContext, stage: Stage, event: UpdateEvent): Promise<void> {
		if (Object.values(event.values).length === 0) {
			return
		}
		await UpdateBuilder.create()
			.table(event.tableName)
			.where({ id: event.rowId })
			.values(event.values)
			.execute(db.client.forSchema(formatSchemaName(stage)))
	}

	private async applyDelete(db: DatabaseContext, stage: Stage, event: DeleteEvent): Promise<void> {
		await DeleteBuilder.create()
			.from(event.tableName)
			.where({ id: event.rowId })
			.execute(db.client.forSchema(formatSchemaName(stage)))
	}

	private async applyRunMigration(
		db: DatabaseContext,
		schema: Schema,
		stage: Stage,
		event: RunMigrationEvent,
	): Promise<Schema> {
		const event_id = (await db.queryHandler.fetch(new StageBySlugQuery(stage.slug)))!.event_id
		const migration = await this.executedMigrationsResolver.getMigrationByVersion(db, event.version)
		if (!migration) {
			throw new Error(`Migration ${event.version} not found`)
		}
		return await this.migrationExecutor.execute(db, schema, { ...stage, event_id }, migration)
	}
}
