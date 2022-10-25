import { Actions } from '@contember/schema'
import { AnyEventPayload } from '../triggers/Payload'
import { InvocationResult, Invoker } from './Invocation'
export declare class WebhookInvoker implements Invoker<any> {
	send(invocation: Actions.WebhookInvocation, payloads: AnyEventPayload[]): Promise<InvocationResult>
}
//# sourceMappingURL=WebhookInvoker.d.ts.map
