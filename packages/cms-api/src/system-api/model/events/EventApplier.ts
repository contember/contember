import { CreateEvent, DeleteEvent, Event, RunMigrationEvent, UpdateEvent } from '../dtos/Event'
import { Stage } from '../dtos/Stage'
import { EventType } from '../EventType'
import { assertNever } from 'cms-common'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import { formatSchemaName } from '../helpers/stageHelpers'
import MigrationExecutor from '../migrations/MigrationExecutor'
import MigrationFilesManager from '../../../migrations/MigrationFilesManager'
import FileNameHelper from '../../../migrations/FileNameHelper'

class EventApplier {
	constructor(
		private readonly db: KnexWrapper,
		private readonly migrationExecutor: MigrationExecutor,
		private readonly migrationsFileManager: MigrationFilesManager
	) {}

	public async applyEvents(stage: Stage, events: Event[]): Promise<void> {
		let trxId: string | null = null
		for (let event of events) {
			if (event.transactionId !== trxId) {
				await this.db.raw('SET CONSTRAINTS ALL IMMEDIATE')
				await this.db.raw('SET CONSTRAINTS ALL DEFERRED')
				trxId = event.transactionId
			}
			await this.applyEvent(stage, event)
		}
		await this.db.raw('SET CONSTRAINTS ALL IMMEDIATE')
	}

	private async applyEvent(stage: Stage, event: Event): Promise<void> {
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
		await this.db
			.forSchema(formatSchemaName(stage))
			.insertBuilder()
			.into(event.tableName)
			.values({ ...event.values, id: event.rowId })
			.execute()
	}

	private async applyUpdate(stage: Stage, event: UpdateEvent): Promise<void> {
		await this.db
			.forSchema(formatSchemaName(stage))
			.updateBuilder()
			.table(event.tableName)
			.where({ id: event.rowId })
			.values(event.values)
			.execute()
	}

	private async applyDelete(stage: Stage, event: DeleteEvent): Promise<void> {
		await this.db
			.forSchema(formatSchemaName(stage))
			.deleteBuilder()
			.from(event.tableName)
			.where({ id: event.rowId })
			.execute()
	}

	private async applyRunMigration(stage: Stage, event: RunMigrationEvent): Promise<void> {
		const files = await this.migrationsFileManager.readFiles(
			'sql',
			version => version === FileNameHelper.extractVersion(event.file)
		)
		await this.migrationExecutor.execute(stage, files, () => null)
	}
}

export default EventApplier
