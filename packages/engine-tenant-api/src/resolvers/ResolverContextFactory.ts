import { ResolverContext } from './ResolverContext'
import { DatabaseContext, PermissionContext, PermissionContextFactory } from '../model'

export const createResolverContext = (permissionContext: PermissionContext, apiKeyId: string) => {
	return {
		apiKeyId: apiKeyId,
		permissionContext,
		identity: permissionContext.identity,
		isAllowed: permissionContext.isAllowed.bind(permissionContext),
		requireAccess: permissionContext.requireAccess.bind(permissionContext),
	}
}

export class ResolverContextFactory {
	constructor(
		private readonly permissionContextFactory: PermissionContextFactory,
	) {}

	public create(authContext: { apiKeyId: string; identityId: string; roles: string[] }, databaseContext: DatabaseContext): ResolverContext {
		const permissionContext = this.permissionContextFactory.create(databaseContext, {
			id: authContext.identityId,
			roles: authContext.roles,
		})
		return {
			...createResolverContext(permissionContext, authContext.apiKeyId),
			db: databaseContext,
		}
	}
}
