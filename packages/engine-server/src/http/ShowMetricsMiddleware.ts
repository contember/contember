import prom from 'prom-client'
import { KoaMiddleware, route } from '../core/koa'

export const createShowMetricsMiddleware = (registry: prom.Registry): KoaMiddleware<any> => {
	return route('/metrics', ctx => {
		ctx.body = registry.metrics()
	})
}
