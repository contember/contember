import { ProcessType } from '../utils/index.js'
import prom, { Registry } from 'prom-client'
import { createContemberEngineInfoMetric } from './contemberEngineInfoMetric.js'

export class PrometheusRegistryFactory {
	constructor(
		private processType: ProcessType,
		private readonly contemberEngineInfo: {version?: string},
	) {
	}

	public create(): Registry {
		if (this.processType === ProcessType.clusterMaster) {
			const register = new prom.AggregatorRegistry()
			prom.collectDefaultMetrics({ register })
			return register
		}
		const register = prom.register
		register.registerMetric(createContemberEngineInfoMetric(this.contemberEngineInfo))
		prom.collectDefaultMetrics({ register })

		return register
	}
}
