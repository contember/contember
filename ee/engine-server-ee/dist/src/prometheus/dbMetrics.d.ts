import prom from 'prom-client'
import { Connection } from '@contember/database'
declare const labelNames: ('contember_project' | 'contember_module' | 'contember_project_group')[]
declare type LabelNames = typeof labelNames[number]
declare type Labels = {
	[K in LabelNames]: string;
}
declare type DatabaseMetricsEntry = {
	connection: Connection.PoolStatusProvider & Connection.Queryable
	labels: Labels
}
declare type Unregistrar = () => void
declare type DatabaseMetricsRegistrar = (entry: DatabaseMetricsEntry) => Unregistrar
export declare const createDbMetricsRegistrar: (registry: prom.Registry) => DatabaseMetricsRegistrar
export {}
//# sourceMappingURL=dbMetrics.d.ts.map
