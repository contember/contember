import { AnyEventPayload } from './Payload'
import { FiredEvent } from './TriggerPayloadManager'
import { Mapper } from '@contember/engine-content-api'
export declare class TriggerPayloadBuilder {
	private readonly mapper
	constructor(mapper: Mapper)
	build(events: FiredEvent[]): Promise<AnyEventPayload[]>
	preprocessEvent(event: FiredEvent): Promise<FiredEvent>
	private buildWatchEventPayloads
	private buildBaseEventPayloads
	private fetchSelection
	private convertSelectionNode
}
//# sourceMappingURL=TriggerPayloadBuilder.d.ts.map
