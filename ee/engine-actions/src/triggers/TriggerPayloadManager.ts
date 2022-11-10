import { Actions, Input, Model } from '@contember/schema'
import { AnyEventPayload } from './Payload'
import { AnyListener } from './TriggerListenersStore'
import { EventCause } from './TriggerHandler'
import { TriggerPayloadBuilder } from './TriggerPayloadBuilder'
import { TriggerPayloadPersister } from './TriggerPayloadPersister'


export interface FiredEvent {
	listener: AnyListener
	cause: EventCause
	entity: Model.Entity
	primary: Input.PrimaryValue
	selection?: any
}

export type GroupedPayloads = {
	trigger: Actions.AnyTrigger
	entity: Model.Entity
	payloads: AnyEventPayload[]
}

export class TriggerPayloadManager {
	private eventsByTrigger: Record<string, FiredEvent[]> = {}

	constructor(
		private readonly triggerPayloadBuilder: TriggerPayloadBuilder,
		private readonly triggerPayloadPersister: TriggerPayloadPersister,
	) {
	}

	public async add(firedEvent: FiredEvent) {
		const event = await this.triggerPayloadBuilder.preprocessEvent(firedEvent)
		this.eventsByTrigger[firedEvent.listener.trigger.name] ??= []
		this.eventsByTrigger[firedEvent.listener.trigger.name].push(event)
	}


	public async persist(): Promise<void> {
		for (const events of Object.values(this.eventsByTrigger)) {
			const payloads = await this.triggerPayloadBuilder.build(events)
			const trigger = events[0].listener.trigger
			await this.triggerPayloadPersister.persist(trigger, payloads)
		}
	}
}

