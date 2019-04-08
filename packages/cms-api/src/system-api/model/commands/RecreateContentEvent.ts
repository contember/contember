import { uuid } from '../../../utils/uuid'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import { ContentEvent } from '../dtos/Event'
import { EventType } from '../EventType'
import { assertNever } from 'cms-common'

class RecreateContentEvent {

	constructor(
		private readonly event: ContentEvent,
		private readonly previousId: string,
		private readonly transactionContext: RecreateContentEvent.TransactionContext,
	) {
	}

	public async execute(db: KnexWrapper) {
		const id = uuid()
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
		private idRemap: Record<string, string> = {}

		public getNewId(oldId: string): string {
			if (!this.idRemap[oldId]) {
				this.idRemap[oldId] = uuid()
			}
			return this.idRemap[oldId]
		}
	}
}

export default RecreateContentEvent
