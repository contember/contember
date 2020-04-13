import { KoaMiddleware } from '../koa'
import { ApiKeyManagerState } from './ApiKeyManagerState'
import { ProjectContainerResolverState } from './ProjectContainerResolverState'
import { ProjectMemberManagerState } from './ProjectMemberManagerState'
import { TenantApolloServerState } from './TenantApolloServerState'
import { ProvidersState } from './ProvidersState'
import { SystemServerState } from './SystemServerState'

export type ServicesState = ApiKeyManagerState &
	ProjectContainerResolverState &
	ProjectMemberManagerState &
	TenantApolloServerState &
	ProvidersState &
	SystemServerState

export const createServicesProviderMiddleware = (services: ServicesState): KoaMiddleware<ServicesState> => {
	return (ctx, next) => {
		ctx.state = {
			...ctx.state,
			apiKeyManager: services.apiKeyManager,
			projectContainerResolver: services.projectContainerResolver,
			projectMemberManager: services.projectMemberManager,
			tenantApolloServer: services.tenantApolloServer,
			providers: services.providers,
			systemServerProvider: services.systemServerProvider,
		}
		return next()
	}
}
