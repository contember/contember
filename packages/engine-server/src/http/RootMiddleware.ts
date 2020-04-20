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
	createDebugInfoMiddleware,
} from '@contember/engine-http'

export const createRootMiddleware = (debug: boolean, services: ServicesState): KoaMiddleware<any> => {
	return compose([
		createDebugInfoMiddleware(debug),
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
