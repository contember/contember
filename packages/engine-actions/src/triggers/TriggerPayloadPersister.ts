import { Client, InsertBuilder } from '@contember/database'
import { Mapper } from '@contember/engine-content-api'
import { Actions, ActionsPayload } from '@contember/schema'
import { EventRow } from '../model/types'
import { notify } from '../utils/notifyChannel'


type EventRowToInsert = Omit<EventRow, 'created_at' | 'visible_at' | 'last_state_change' | 'log'> & {
	created_at: string | Date
	visible_at: string | Date
	last_state_change: string | Date
}

export class TriggerPayloadPersister {
	constructor(
		private readonly mapper: Mapper,
		private readonly client: Client,
		private readonly providers: { uuid: () => string },
		private readonly projectSlug: string,
		private readonly stageId: string,
		private readonly schemaId?: number,
	) {
	}

	public async persist(trigger: Actions.AnyTrigger, payloads: ActionsPayload.AnyEventPayload[]): Promise<void> {
		const chunkSize = 100
		if (!this.schemaId) {
			throw new Error('Schema id is not set')
		}
		for (let i = 0; i < payloads.length; i += chunkSize) {
			const chunk = payloads.slice(i, i + chunkSize)
			await InsertBuilder.create()
				.into('actions_event')
				.values(chunk.map((it): EventRowToInsert => ({
					id: this.providers.uuid(),
					transaction_id: this.mapper.transactionId,
					created_at: 'now',
					visible_at: 'now',
					num_retries: 0,
					state: 'created',
					stage_id: this.stageId,
					schema_id: this.schemaId!,
					target: trigger.target,
					trigger: trigger.name,
					priority: trigger.priority ?? 0,
					payload: it,
					resolved_at: null,
					last_state_change: 'now',
				})))
				.execute(this.client)
		}

		await notify(this.client, this.projectSlug)
	}
}
