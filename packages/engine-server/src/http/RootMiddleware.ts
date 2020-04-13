import { compose, route } from '../core/koa'
import { createErrorResponseMiddleware, createTimerMiddleware } from './common'
import { createHomepageMiddleware, createPlaygroundMiddleware } from './misc'
import { createContentMiddleware } from './content'
import { createTenantMiddleware } from './tenant'
import { createSystemMiddleware } from './system'
import { createServicesProviderMiddleware, ServicesState } from './services/ServicesProviderMiddleware'

export const createRootMiddleware = (services: ServicesState) => {
	return compose([
		createServicesProviderMiddleware(services),
		createErrorResponseMiddleware(),
		createTimerMiddleware(),
		route('/playground$', createPlaygroundMiddleware()),
		createHomepageMiddleware(),
		createContentMiddleware(),
		createTenantMiddleware(),
		createSystemMiddleware(),
	])
}
