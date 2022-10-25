import { Actions } from '@contember/schema'
import { EventRow, InvokeHandler, HandledEvent } from './types'
import { Logger } from '@contember/logger'
export declare class WebhookTargetHandler implements InvokeHandler<Actions.WebhookTarget> {
	handle(invocation: Actions.WebhookTarget, events: EventRow[], logger: Logger): Promise<HandledEvent[]>
}
//# sourceMappingURL=WebhookTargetHandler.d.ts.map
