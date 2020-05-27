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
import prom from 'prom-client'
import { createColllectHttpMetricsMiddleware } from './CollectHttpMetricsMiddelware'

export const createRootMiddleware = (
	debug: boolean,
	services: ServicesState,
	prometheusRegistry: prom.Registry,
): KoaMiddleware<any> => {
	return compose([
		createColllectHttpMetricsMiddleware(prometheusRegistry),
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
