import { UuidProvider } from '../../utils/uuid'
import { Client } from '@contember/database'
import { ContentEvent } from '../dtos/Event'
import { EventType } from '../EventType'
import { assertNever } from '@contember/utils'

class RecreateContentEvent {
	constructor(
		private readonly event: ContentEvent,
		private readonly previousId: string,
		private readonly transactionContext: RecreateContentEvent.TransactionContext,
		private readonly providers: UuidProvider,
	) {}

	public async execute(db: Client) {
		const id = this.providers.uuid()
		await db
			.insertBuilder()
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
			.execute()
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
