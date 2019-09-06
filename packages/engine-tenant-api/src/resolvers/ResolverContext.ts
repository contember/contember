import { AuthorizationScope, Authorizator } from '@contember/authorization'
import { Identity } from '@contember/engine-common'
import { PermissionContext } from '../model/authorization'

export class ResolverContext {
	constructor(public readonly apiKeyId: string, public readonly permissionContext: PermissionContext) {}

	get identity(): Identity {
		return this.permissionContext.identity
	}

	public async isAllowed(args: {
		scope?: AuthorizationScope<Identity>
		action: Authorizator.Action
	}): Promise<boolean> {
		return this.permissionContext.isAllowed(args)
	}

	public async requireAccess(args: {
		scope?: AuthorizationScope<Identity>
		action: Authorizator.Action
		message?: string
	}): Promise<void> {
		this.permissionContext.requireAccess(args)
	}
}
