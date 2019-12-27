import { UuidProvider } from '../../utils/uuid'
import { Client, InsertBuilder } from '@contember/database'
import { ContentEvent, EventType } from '@contember/engine-common'
import { assertNever } from '../../utils'

class RecreateContentEvent {
	constructor(
		private readonly event: ContentEvent,
		private readonly previousId: string,
		private readonly transactionContext: RecreateContentEvent.TransactionContext,
		private readonly providers: UuidProvider,
	) {}

	public async execute(db: Client) {
		const id = this.providers.uuid()
		await InsertBuilder.create()
			.into('event')
			.values({
				id,
				type: this.event.type,
				data: this.createData(),
				previous_id: this.previousId,
				transaction_id: this.transactionContext.getNewId(this.event.transactionId),
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

namespace RecreateContentEvent {
	export class TransactionContext {
		constructor(private readonly providers: UuidProvider) {}
		private idRemap: Record<string, string> = {}

		public getNewId(oldId: string): string {
			if (!this.idRemap[oldId]) {
				this.idRemap[oldId] = this.providers.uuid()
			}
			return this.idRemap[oldId]
		}
	}
}

export default RecreateContentEvent
