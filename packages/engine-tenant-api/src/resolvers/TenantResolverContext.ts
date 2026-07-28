import { DatabaseContext, Identity, PermissionContext } from '../model/index.js'
import { Logger } from '@contember/logger'
import { AuthLogService } from '../model/service/AuthLogService.js'

export interface TenantResolverHttpInfo {
	readonly ip: string
	readonly userAgent?: string
	/** A03: country from the trusted reverse-proxy geo header, when present + trusted. */
	readonly geoCountry?: string
}

export interface TenantResolverContext {
	readonly apiKeyId: string
	readonly trustForwardedInfo: boolean
	readonly permissionContext: PermissionContext
	readonly identity: Identity
	readonly isAllowed: PermissionContext['isAllowed']
	readonly requireAccess: PermissionContext['requireAccess']
	readonly db: DatabaseContext
	readonly logger: Logger
	readonly logAuthAction: (entry: AuthLogService.LogArgs, db?: DatabaseContext) => Promise<void>
	readonly httpInfo: TenantResolverHttpInfo
}
