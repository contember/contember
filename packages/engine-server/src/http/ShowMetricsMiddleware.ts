import { KoaMiddleware, route } from '@contember/engine-http'
import prom from 'prom-client'

export const createShowMetricsMiddleware = (registry: prom.Registry): KoaMiddleware<any> => {
	return route('/metrics', async ctx => {
		if (registry instanceof prom.AggregatorRegistry) {
			ctx.body = await registry.clusterMetrics()
		} else {
			ctx.body = registry.metrics()
		}
	})
}
