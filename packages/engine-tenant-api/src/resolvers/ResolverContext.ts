import { Identity, PermissionContext } from '../model/authorization'
import { DatabaseContext } from '../model'

export interface ResolverContext {
	readonly apiKeyId: string
	readonly permissionContext: PermissionContext
	readonly identity: Identity
	readonly isAllowed: PermissionContext['isAllowed']
	readonly requireAccess: PermissionContext['requireAccess']
	readonly db: DatabaseContext
}
