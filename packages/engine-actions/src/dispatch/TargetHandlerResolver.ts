import { Actions } from '@contember/schema'
import { WebhookTargetHandler } from './WebhookTargetHandler'
import { ImplementationException } from '../ImplementationException'
import { InvokeHandler } from './types'

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
