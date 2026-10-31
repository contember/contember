import { Actions } from '@contember/schema'
import { WebhookTargetHandler } from './WebhookTargetHandler.js'
import { AuditLogTargetHandler } from './AuditLogTargetHandler.js'
import { InvokeHandler } from './types.js'
import { assertNever } from '../utils/assertNever.js'

export class TargetHandlerResolver {
	constructor(
		private readonly webhookHandler: WebhookTargetHandler,
		private readonly auditLogHandler: AuditLogTargetHandler,
	) {
	}

	public resolveHandler(target: Actions.AnyTarget): InvokeHandler<Actions.AnyTarget> {
		switch (target.type) {
			case 'webhook':
				return this.webhookHandler
			case 'auditLog':
				return this.auditLogHandler
			default:
				return assertNever(target)
		}
	}
}
