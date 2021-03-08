import { InsertBuilder } from '@contember/database'
import { ContentEvent, EventType } from '@contember/engine-common'
import { assertNever, Providers } from '../../../utils'
import { Command } from '../Command'

export class RecreateContentEvent implements Command<string> {
	constructor(
		private readonly event: ContentEvent,
		private readonly previousId: string,
		private readonly transactionContext: RecreateContentEventTransactionContext,
	) {}

	public async execute({ db, providers }: Command.Args) {
		const id = providers.uuid()
		await InsertBuilder.create()
			.into('event')
			.values({
				id,
				type: this.event.type,
				data: this.createData(),
				previous_id: this.previousId,
				transaction_id: this.transactionContext.getNewId(this.event.transactionId, providers),
				identity_id: this.event.identityId,
				created_at: this.event.createdAt,
			})
			.execute(db)
		return id
	}

	private createData(): any {
		switch (this.event.type) {
			case EventType.delete:
				return { tableName: this.event.tableName, rowId: this.event.rowId }
			case EventType.create:
			case EventType.update:
				return { tableName: this.event.tableName, rowId: this.event.rowId, values: this.event.values }
			default:
				assertNever(this.event)
		}
	}
}

export class RecreateContentEventTransactionContext {
	private idRemap: Record<string, string> = {}

	public getNewId(oldId: string, providers: Providers): string {
		if (!this.idRemap[oldId]) {
			this.idRemap[oldId] = providers.uuid()
		}
		return this.idRemap[oldId]
	}
}
