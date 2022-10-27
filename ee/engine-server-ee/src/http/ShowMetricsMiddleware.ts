import { HttpController, HttpResponse } from '@contember/engine-http'
import prom from 'prom-client'

export const createShowMetricsMiddleware = (registry: prom.Registry): HttpController => {
	return async () => {
		if (registry instanceof prom.AggregatorRegistry) {
			return new HttpResponse(200, await registry.clusterMetrics())
		} else {
			return new HttpResponse(200, registry.metrics())
		}
	}
}
