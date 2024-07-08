import { KoaMiddleware } from '@contember/engine-http'
import prom from 'prom-client'

export const createShowMetricsMiddleware = (registry: prom.Registry): KoaMiddleware<any> => {
	return async (ctx, next) => {
		if (ctx.path !== '/metrics') {
			return next()
		}
		if (registry instanceof prom.AggregatorRegistry) {
			ctx.body = await registry.clusterMetrics()
		} else {
			ctx.body = registry.metrics()
		}
	}
}
