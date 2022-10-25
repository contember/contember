import { Actions } from '@contember/schema'
import { AnyEventPayload } from '../triggers/Payload'
export interface InvokeHandler<Type extends Actions.AnyInvocation> {
	send(invocation: Type, payloads: AnyEventPayload[]): Promise<InvocationResult>
}
export declare type InvocationResult = {
	ok: boolean
	durationMs?: number
	errorMessage?: string
	code?: number
	response?: string
}
//# sourceMappingURL=Invocation.d.ts.map
