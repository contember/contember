import { TenantResolverContext } from './TenantResolverContext'
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

export class TenantResolverContextFactory {
	constructor(
		private readonly permissionContextFactory: PermissionContextFactory,
	) {}

	public create(
		authContext: { apiKeyId: string; identityId: string; roles: string[] },
		db: DatabaseContext,
	): TenantResolverContext {
		const permissionContext = this.permissionContextFactory.create(db, {
			id: authContext.identityId,
			roles: authContext.roles,
		})
		return {
			...createResolverContext(permissionContext, authContext.apiKeyId),
			db,
		}
	}
}
