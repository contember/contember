import { DatabaseContext, Identity, PermissionContext } from '../model'

export interface TenantResolverContext {
	readonly apiKeyId: string
	readonly permissionContext: PermissionContext
	readonly identity: Identity
	readonly isAllowed: PermissionContext['isAllowed']
	readonly requireAccess: PermissionContext['requireAccess']
	readonly db: DatabaseContext
}
