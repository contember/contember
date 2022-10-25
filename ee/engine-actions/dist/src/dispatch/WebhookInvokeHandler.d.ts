import { Actions } from '@contember/schema'
import { EventRow, InvokeHandler, HandledEvent } from './types'
export declare class WebhookInvokeHandler implements InvokeHandler<any> {
	handle(invocation: Actions.WebhookInvocation, events: EventRow[]): Promise<HandledEvent[]>
}
//# sourceMappingURL=WebhookInvokeHandler.d.ts.map
