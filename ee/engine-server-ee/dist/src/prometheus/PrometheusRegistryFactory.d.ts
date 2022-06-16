import { ProcessType } from '../utils'
import { Registry } from 'prom-client'
export declare class PrometheusRegistryFactory {
	private processType
	private readonly contemberEngineInfo
	constructor(processType: ProcessType, contemberEngineInfo: {
		version?: string
	})
	create(): Registry
}
//# sourceMappingURL=PrometheusRegistryFactory.d.ts.map
