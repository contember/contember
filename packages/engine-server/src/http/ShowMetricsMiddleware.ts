import { KoaMiddleware, route } from '@contember/engine-http'
import prom from 'prom-client'

export const createShowMetricsMiddleware = (registry: prom.Registry): KoaMiddleware<any> => {
	return route('/metrics', ctx => {
		ctx.body = registry.metrics()
	})
}
