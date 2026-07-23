import { TenantResolverContext } from './TenantResolverContext.js'
import { DatabaseContext, LoginRiskAnalyzer, PermissionContext, PermissionContextFactory, UNPERSISTED_ROOT_IDENTITY_ID } from '../model/index.js'
import { Logger } from '@contember/logger'
import { AuthLogService } from '../model/service/AuthLogService.js'

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
		private readonly loginRiskAnalyzer: LoginRiskAnalyzer,
	) {}

	public create(
		authContext: { apiKeyId: string; identityId: string; roles: string[]; trustForwardedInfo?: boolean },
		httpInfo: { ip: string; userAgent?: string; forwarderIp?: string; forwarderUserAgent?: string; geoCountry?: string },
		db: DatabaseContext,
		logger: Logger,
	): TenantResolverContext {
		const permissionContext = this.permissionContextFactory.create(db, {
			id: authContext.identityId,
			roles: authContext.roles,
		})
		// A03: stamp every auth-log row with the trusted geo country (when present)
		// and a UA fingerprint, so the next sign-in's anomaly check has a baseline.
		const deviceFingerprint = this.loginRiskAnalyzer.fingerprint(httpInfo.userAgent) ?? undefined
		const unpersistedRoot = authContext.identityId === UNPERSISTED_ROOT_IDENTITY_ID
		return {
			...createResolverContext(permissionContext, authContext.apiKeyId, authContext.trustForwardedInfo ?? false),
			logAuthAction: async (data, transaction) => {
				await this.authLogService.logAuthAction(transaction ?? db, {
					identityId: unpersistedRoot ? undefined : authContext.identityId,
					unpersistedRoot,
					userAgent: httpInfo.userAgent,
					clientIp: httpInfo.ip,
					forwarderIp: httpInfo.forwarderIp,
					forwarderUserAgent: httpInfo.forwarderUserAgent,
					geoCountry: httpInfo.geoCountry,
					deviceFingerprint,
				}, data)
			},
			httpInfo: {
				ip: httpInfo.ip,
				userAgent: httpInfo.userAgent,
				geoCountry: httpInfo.geoCountry,
			},
			db,
			logger,
		}
	}
}
