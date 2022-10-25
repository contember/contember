import { GroupedPayloads } from './TriggerPayloadBuilder'
export interface TriggerPayloadDispatcher {
	dispatch(payloads: GroupedPayloads[]): Promise<void>
}
//# sourceMappingURL=TriggerPayloadDispatcher.d.ts.map
