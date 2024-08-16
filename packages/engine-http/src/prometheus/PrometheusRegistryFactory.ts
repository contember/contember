import prom, { Registry } from 'prom-client'
import { createContemberEngineInfoMetric } from './contemberEngineInfoMetric'
import { ProcessType } from '../MasterContainer'

export class PrometheusRegistryFactory {
	constructor(
		private processType: ProcessType,
		private readonly contemberEngineInfo: { version?: string },
	) {
	}

	public create(): Registry {
		if (this.processType === 'clusterMaster') {
			const register = new prom.AggregatorRegistry()
			prom.collectDefaultMetrics({ register })
			return register
		}
		const register = prom.register
		register.registerMetric(createContemberEngineInfoMetric(this.contemberEngineInfo))
		if (!('Bun' in global)) {
			prom.collectDefaultMetrics({ register })
		}

		return register
	}
}
