import { Client, InsertBuilder } from '@contember/database'
import { Mapper, TriggeredActionEvent, TriggeredActionsCollector } from '@contember/engine-content-api'
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
		private readonly schemaId: number | undefined,
		private readonly identityId: string,
		private readonly userInfo: { ipAddress: string | null; userAgent: string | null },
		private readonly triggeredActionsCollector: TriggeredActionsCollector | undefined,
	) {
	}

	public async persist(trigger: Actions.AnyTrigger, payloads: ActionsPayload.AnyEventPayload[]): Promise<void> {
		const chunkSize = 100
		if (!this.schemaId) {
			throw new Error('Schema id is not set')
		}
		const collector = this.triggeredActionsCollector
		for (let i = 0; i < payloads.length; i += chunkSize) {
			const chunk = payloads.slice(i, i + chunkSize)
			const collected: TriggeredActionEvent[] | undefined = collector ? [] : undefined
			const rows = chunk.map((it): EventRowToInsert => {
				const id = this.providers.uuid()
				const transactionId = this.mapper.transactionId
				collected?.push({ id, trigger: trigger.name, target: trigger.target, transactionId })
				return {
					id,
					transaction_id: transactionId,
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
					identity_id: this.identityId,
					ip_address: this.userInfo.ipAddress,
					user_agent: this.userInfo.userAgent,
				}
			})
			await InsertBuilder.create()
				.into('actions_event')
				.values(rows)
				.execute(this.client)

			if (collected && collected.length > 0) {
				collector!.add(collected)
			}
		}

		await notify(this.client, this.projectSlug)
	}
}
