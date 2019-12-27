import { AnyEvent, CreateEvent, DeleteEvent, RunMigrationEvent, UpdateEvent } from '@contember/engine-common'
import { Stage } from '../dtos/Stage'
import { EventType } from '@contember/engine-common'
import { assertNever } from '../../utils'
import { Client, DeleteBuilder, InsertBuilder, UpdateBuilder } from '@contember/database'
import { formatSchemaName } from '../helpers/stageHelpers'
import MigrationExecutor from '../migrations/MigrationExecutor'
import { MigrationsResolver } from '@contember/schema-migrations'
import StageBySlugQuery from '../queries/StageBySlugQuery'

class EventApplier {
	constructor(
		private readonly db: Client,
		private readonly migrationExecutor: MigrationExecutor,
		private readonly migrationResolver: MigrationsResolver,
	) {}

	public async applyEvents(stage: Stage, events: AnyEvent[]): Promise<void> {
		let trxId: string | null = null
		for (let event of events) {
			if (event.transactionId !== trxId) {
				await this.db.query('SET CONSTRAINTS ALL IMMEDIATE')
				await this.db.query('SET CONSTRAINTS ALL DEFERRED')
				trxId = event.transactionId
			}
			await this.applyEvent(stage, event)
		}
		await this.db.query('SET CONSTRAINTS ALL IMMEDIATE')
	}

	private async applyEvent(stage: Stage, event: AnyEvent): Promise<void> {
		switch (event.type) {
			case EventType.create:
				return this.applyCreate(stage, event)
			case EventType.update:
				return this.applyUpdate(stage, event)
			case EventType.delete:
				return this.applyDelete(stage, event)
			case EventType.runMigration:
				return this.applyRunMigration(stage, event)
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

	private async applyRunMigration(stage: Stage, event: RunMigrationEvent): Promise<void> {
		const event_id = (await this.db.createQueryHandler().fetch(new StageBySlugQuery(stage.slug)))!.event_id
		const files = (await this.migrationResolver.getMigrations()).filter(({ version }) => version === event.version)
		await this.migrationExecutor.execute(this.db, { ...stage, event_id }, files, () => null)
	}
}

export default EventApplier
