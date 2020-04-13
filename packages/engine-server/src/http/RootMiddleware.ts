import {
	compose,
	createContentMiddleware,
	createErrorResponseMiddleware,
	createHomepageMiddleware,
	createPlaygroundMiddleware,
	createServicesProviderMiddleware,
	createSystemMiddleware,
	createTenantMiddleware,
	createTimerMiddleware,
	route,
	ServicesState,
	KoaMiddleware,
} from '@contember/engine-http'

export const createRootMiddleware = (services: ServicesState): KoaMiddleware<any> => {
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
