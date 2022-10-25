import { Actions } from '@contember/schema'
import { WebhookInvokeHandler } from './WebhookInvokeHandler'
import { InvokeHandler } from './types'
export interface ResolvedInvoker<T extends Actions.AnyInvocation = Actions.AnyInvocation> {
	definition: T
	handler: InvokeHandler<T>
}
export declare class InvokerResolver {
	private readonly actions
	private readonly webhookHandler
	constructor(actions: Actions.Schema, webhookHandler: WebhookInvokeHandler)
	resolveInvoker(triggerName: string): undefined | ResolvedInvoker
}
//# sourceMappingURL=InvokerResolver.d.ts.map
