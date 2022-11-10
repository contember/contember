import { Client, InsertBuilder } from '@contember/database'
import { AnyEventPayload } from './Payload'
import { Mapper } from '@contember/engine-content-api'
import { Actions } from '@contember/schema'

export const NOTIFY_CHANNEL_NAME = 'actions_event'
export class TriggerPayloadPersister {
	constructor(
		private readonly mapper: Mapper,
		private readonly client: Client,
		private readonly providers: { uuid: () => string },
		private readonly projectSlug: string,
		private readonly stageId: string,
		private readonly schemaId: number,
	) {
	}

	public async persist(trigger: Actions.AnyTrigger, payloads: AnyEventPayload[]): Promise<void> {
		const chunkSize = 100
		for (let i = 0; i < payloads.length; i += chunkSize) {
			const chunk = payloads.slice(i, i + chunkSize)
			await InsertBuilder.create()
				.into('actions_event')
				.values(chunk.map(it => ({
					id: this.providers.uuid(),
					transaction_id: this.mapper.transactionId,
					created_at: 'now',
					visible_at: 'now',
					num_retries: 0,
					state: 'created',
					stage_id: this.stageId,
					schema_id: this.schemaId,
					target: trigger.target,
					trigger: trigger.name,
					priority: trigger.priority ?? 0,
					payload: it,
				})))
				.execute(this.client)
		}

		await this.client.query('SELECT pg_notify(?, ?)', [NOTIFY_CHANNEL_NAME, this.projectSlug])
	}
}
