import { DatabaseContext, Identity, PermissionContext } from '../model'
import { Logger } from '@contember/logger'
import { AuthLogService } from '../model/service/AuthLogService'

export interface TenantResolverContext {
	readonly apiKeyId: string
	readonly permissionContext: PermissionContext
	readonly identity: Identity
	readonly isAllowed: PermissionContext['isAllowed']
	readonly requireAccess: PermissionContext['requireAccess']
	readonly db: DatabaseContext
	readonly logger: Logger
	readonly logAuthAction: (entry: AuthLogService.LogArgs) => Promise<void>
}
