import { ResolverContext } from './ResolverContext'
import { PermissionContextFactory } from '../model/authorization/PermissionContextFactory'

export class ResolverContextFactory {
	constructor(private readonly permissionContextFactory: PermissionContextFactory) {}

	public create(authContext: { apiKeyId: string; identityId: string; roles: string[] }): ResolverContext {
		return new ResolverContext(
			authContext.apiKeyId,
			this.permissionContextFactory.create({ id: authContext.identityId, roles: authContext.roles }),
		)
	}
}
