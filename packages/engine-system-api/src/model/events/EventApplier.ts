import {
	AnyEvent,
	ContentEvent,
	CreateEvent,
	DeleteEvent,
	EventType,
	RunMigrationEvent,
	UpdateEvent,
} from '@contember/engine-common'
import { Stage } from '../dtos/Stage'
import { assertNever } from '../../utils'
import { Client, DeleteBuilder, InsertBuilder, UpdateBuilder } from '@contember/database'
import { formatSchemaName } from '../helpers'
import MigrationExecutor from '../migrations/MigrationExecutor'
import { StageBySlugQuery } from '../queries'
import { ExecutedMigrationsResolver } from '../migrations/ExecutedMigrationsResolver'
import { Schema } from '@contember/schema'

class EventApplier {
	constructor(
		private readonly db: Client,
		private readonly migrationExecutor: MigrationExecutor,
		private readonly executedMigrationsResolver: ExecutedMigrationsResolver,
	) {}

	public async applyEvents(stage: Stage, events: ContentEvent[]): Promise<void>
	public async applyEvents(stage: Stage, events: AnyEvent[], schema: Schema): Promise<void>
	public async applyEvents(stage: Stage, events: AnyEvent[], schema?: Schema): Promise<void> {
		let trxId: string | null = null
		for (let event of events) {
			if (event.transactionId !== trxId) {
				await this.db.query('SET CONSTRAINTS ALL IMMEDIATE')
				await this.db.query('SET CONSTRAINTS ALL DEFERRED')
				trxId = event.transactionId
			}
			if (schema) {
				schema = await this.applyEvent(stage, event, schema)
			} else {
				await this.applyEvent(stage, event as ContentEvent)
			}
		}
		await this.db.query('SET CONSTRAINTS ALL IMMEDIATE')
	}

	private async applyEvent(stage: Stage, event: ContentEvent): Promise<undefined>
	private async applyEvent(stage: Stage, event: AnyEvent, schema: Schema): Promise<Schema>
	private async applyEvent(stage: Stage, event: AnyEvent, schema?: Schema) {
		switch (event.type) {
			case EventType.create:
				return this.applyCreate(stage, event)
			case EventType.update:
				return this.applyUpdate(stage, event)
			case EventType.delete:
				return this.applyDelete(stage, event)
			case EventType.runMigration:
				return this.applyRunMigration(schema!, stage, event)
			default:
				assertNever(event)
		}
	}

	private async applyCreate(stage: Stage, event: CreateEvent): Promise<void> {
		await InsertBuilder.create()
			.into(event.tableName)
			.values({ ...event.values, id: event.rowId })
			.execute(this.db.forSchema(formatSchemaName(stage)))
	}

	private async applyUpdate(stage: Stage, event: UpdateEvent): Promise<void> {
		if (Object.values(event.values).length === 0) {
			return
		}
		await UpdateBuilder.create()
			.table(event.tableName)
			.where({ id: event.rowId })
			.values(event.values)
			.execute(this.db.forSchema(formatSchemaName(stage)))
	}

	private async applyDelete(stage: Stage, event: DeleteEvent): Promise<void> {
		await DeleteBuilder.create()
			.from(event.tableName)
			.where({ id: event.rowId })
			.execute(this.db.forSchema(formatSchemaName(stage)))
	}

	private async applyRunMigration(schema: Schema, stage: Stage, event: RunMigrationEvent): Promise<Schema> {
		const event_id = (await this.db.createQueryHandler().fetch(new StageBySlugQuery(stage.slug)))!.event_id
		const migration = await this.executedMigrationsResolver.getMigrationByVersion(event.version)
		if (!migration) {
			throw new Error(`Migration ${event.version} not found`)
		}
		return await this.migrationExecutor.execute(schema, this.db, { ...stage, event_id }, migration)
	}
}

export default EventApplier
