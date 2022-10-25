import { Actions } from '@contember/schema'
import { WebhookTargetHandler } from './WebhookTargetHandler'
import { InvokeHandler } from './types'
export declare class TargetHandlerResolver {
	private readonly webhookHandler
	constructor(webhookHandler: WebhookTargetHandler)
	resolveHandler<T extends Actions.AnyTarget>(target: T): InvokeHandler<T>
}
//# sourceMappingURL=TargetHandlerResolver.d.ts.map
