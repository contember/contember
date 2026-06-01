import { Actions } from '@contember/schema'
import { WebhookTargetHandler } from './WebhookTargetHandler.js'
import { ImplementationException } from '../ImplementationException.js'
import { InvokeHandler } from './types.js'

export class TargetHandlerResolver {
	constructor(
		private readonly webhookHandler: WebhookTargetHandler,
	) {
	}

	public resolveHandler<T extends Actions.AnyTarget>(target: T): InvokeHandler<T> {
		if (target.type !== 'webhook') {
			throw new ImplementationException('Invalid trigger invocation type')
		}
		return this.webhookHandler
	}
}
