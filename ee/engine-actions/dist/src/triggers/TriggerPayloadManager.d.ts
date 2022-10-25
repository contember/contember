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
export declare type GroupedPayloads = {
	trigger: Actions.AnyTrigger
	entity: Model.Entity
	payloads: AnyEventPayload[]
}
export declare class TriggerPayloadManager {
	private readonly triggerPayloadBuilder
	private readonly triggerPayloadPersister
	private eventsByTrigger
	constructor(triggerPayloadBuilder: TriggerPayloadBuilder, triggerPayloadPersister: TriggerPayloadPersister)
	add(firedEvent: FiredEvent): Promise<void>
	persist(): Promise<void>
}
//# sourceMappingURL=TriggerPayloadManager.d.ts.map
