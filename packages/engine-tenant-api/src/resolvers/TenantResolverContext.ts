import { DatabaseContext, Identity, PermissionContext } from '../model'
import { Logger } from '@contember/engine-common'

export interface TenantResolverContext {
	readonly apiKeyId: string
	readonly permissionContext: PermissionContext
	readonly identity: Identity
	readonly isAllowed: PermissionContext['isAllowed']
	readonly requireAccess: PermissionContext['requireAccess']
	readonly db: DatabaseContext
	readonly logger: Logger
}
