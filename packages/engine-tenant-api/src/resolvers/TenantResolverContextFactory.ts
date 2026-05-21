import { TenantResolverContext } from './TenantResolverContext'
import { DatabaseContext, PermissionContext, PermissionContextFactory } from '../model'
import { Logger } from '@contember/logger'
import { AuthLogService } from '../model/service/AuthLogService'

export const createResolverContext = (permissionContext: PermissionContext, apiKeyId: string, trustForwardedInfo = false) => {
	return {
		apiKeyId: apiKeyId,
		trustForwardedInfo,
		permissionContext,
		identity: permissionContext.identity,
		isAllowed: permissionContext.isAllowed.bind(permissionContext),
		requireAccess: permissionContext.requireAccess.bind(permissionContext),
		httpInfo: { ip: '' },
	}
}

export class TenantResolverContextFactory {
	constructor(
		private readonly permissionContextFactory: PermissionContextFactory,
		private readonly authLogService: AuthLogService,
	) {}

	public create(
		authContext: { apiKeyId: string; identityId: string; roles: string[]; trustForwardedInfo?: boolean },
		httpInfo: { ip: string; userAgent?: string; forwarderIp?: string; forwarderUserAgent?: string },
		db: DatabaseContext,
		logger: Logger,
	): TenantResolverContext {
		const permissionContext = this.permissionContextFactory.create(db, {
			id: authContext.identityId,
			roles: authContext.roles,
		})
		return {
			...createResolverContext(permissionContext, authContext.apiKeyId, authContext.trustForwardedInfo ?? false),
			logAuthAction: async data => {
				await this.authLogService.logAuthAction(db, {
					identityId: authContext.identityId,
					userAgent: httpInfo.userAgent,
					clientIp: httpInfo.ip,
					forwarderIp: httpInfo.forwarderIp,
					forwarderUserAgent: httpInfo.forwarderUserAgent,
				}, data)
			},
			httpInfo: {
				ip: httpInfo.ip,
				userAgent: httpInfo.userAgent,
			},
			db,
			logger,
		}
	}
}
