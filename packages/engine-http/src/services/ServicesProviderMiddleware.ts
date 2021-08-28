import { KoaMiddleware } from '../koa'
import { ApiKeyManagerState } from './ApiKeyManagerState'
import { ProjectContainerResolverState } from './ProjectContainerResolverState'
import { ProjectMemberManagerState } from './ProjectMemberManagerState'
import { ProvidersState } from './ProvidersState'

export type ServicesState =
	& ApiKeyManagerState
	& ProjectContainerResolverState
	& ProjectMemberManagerState
	& ProvidersState

export const createServicesProviderMiddleware = (services: ServicesState): KoaMiddleware<ServicesState> => {
	return (ctx, next) => {
		ctx.state = {
			...ctx.state,
			apiKeyManager: services.apiKeyManager,
			projectContainerResolver: services.projectContainerResolver,
			projectMemberManager: services.projectMemberManager,
			providers: services.providers,
		}
		return next()
	}
}
