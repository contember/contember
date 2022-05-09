import prom from 'prom-client'
import { Connection, EventManager } from '@contember/database'

const labelNames = ['contember_project' as const, 'contember_module' as const, 'contember_project_group' as const]
type LabelNames = typeof labelNames[number]
type Labels = { [K in LabelNames]: string }
type DatabaseMetricsEntry = {
	connection: Connection.PoolStatusProvider & Connection.Queryable
	labels: Labels
}
type Unregistrar = () => void
type DatabaseMetricsRegistrar = (entry: DatabaseMetricsEntry) => Unregistrar

export const createDbMetricsRegistrar = (registry: prom.Registry): DatabaseMetricsRegistrar => {
	const dbPoolCollectorInner = createSingleDbPoolMetricsCollector(registry)
	const entries = new Set<DatabaseMetricsEntry>()
	const collector = () => {
		for (const entry of entries) {
			dbPoolCollectorInner(entry.connection, entry.labels)
		}
	}
	registry.registerCollector(collector)
	const sqlMetricsRegistrar = createSqlMetricsRegistrar(registry)
	return entry => {
		entries.add(entry)
		const sqlMetricsUnregistrar = sqlMetricsRegistrar(entry.connection, entry.labels)
		return () => {
			entries.delete(entry)
			sqlMetricsUnregistrar()
		}
	}
}

const createSingleDbPoolMetricsCollector = (registry: prom.Registry) => {

	const totalCount = new prom.Gauge({
		registers: [registry],
		name: `contember_db_pool_total_count`,
		help: 'The total number of clients existing within the pool by contember_module (tenant or content; system is not used since it uses the same connection) and contember_project for contember_module=content.',
		labelNames,
	})
	const idleCount = new prom.Gauge({
		registers: [registry],
		name: `contember_db_pool_idle_count`,
		help: 'The number of clients which are not checked out but are currently idle in the pool by contember_module (tenant or content; system is not used since it uses the same connection) and contember_project for contember_module=content.',
		labelNames,
	})
	const waitingCount = new prom.Gauge({
		registers: [registry],
		name: `contember_db_pool_waiting_count`,
		help: 'The number of queued requests waiting on a client when all clients are checked out. It can be helpful to monitor this number to see if you need to adjust the size of the pool by contember_module (tenant or content; system is not used since it uses the same connection) and contember_project for contember_module=content.',
		labelNames,
	})
	const maxCount = new prom.Gauge({
		registers: [registry],
		name: `contember_db_pool_max_count`,
		help: 'Maximum number of clients the pool should contain by contember_module (tenant or content; system is not used since it uses the same connection) and contember_project for contember_module=content.',
		labelNames,
	})

	return (db: Connection.PoolStatusProvider, labels: Labels) => {
		const poolInfo = db.getPoolStatus()
		totalCount.set(labels, poolInfo.pending + poolInfo.idle + poolInfo.connecting)
		idleCount.set(labels, poolInfo.idle)
		waitingCount.set(labels, poolInfo.pending)
		maxCount.set(labels, poolInfo.max)
	}
}
type SqlMetricsRegistrar = (
	connection: Connection.Queryable,
	labels: Labels,
) => Unregistrar
const createSqlMetricsRegistrar = (registry: prom.Registry): SqlMetricsRegistrar => {
	const sqlDuration = new prom.Histogram({
		name: 'contember_sql_duration_ms',
		help: 'Executed SQL queries by contember_module (system, tenant, content or unknown) and contember_project (or "unknown" for unknown project)',
		registers: [registry],
		labelNames,
		buckets: [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000],
	})
	const sqlErrorRate = new prom.Counter({
		name: 'contember_sql_error_count',
		help: 'Failed SQL queries by contember_module (system, tenant, content or unknown) and contember_project (or "unknown" for unknown project)',
		labelNames,
		registers: [registry],
	})

	return (connection, labels) => {
		const queryEndCallback: EventManager.ListenerTypes[EventManager.Event.queryEnd] = ({ meta }, { timing }) => {
			sqlDuration.observe(
				{
					...labels,
					contember_module: meta.module || labels.contember_module,
				},
				timing ? timing.selfDuration / 1000 : 0,
			)
		}
		const queryErrorCallback: EventManager.ListenerTypes[EventManager.Event.queryError] = ({ meta }) => {
			sqlErrorRate.inc({
				...labels,
				contember_module: meta.module || labels.contember_module,
			})
		}
		connection.eventManager.on(EventManager.Event.queryEnd, queryEndCallback)
		connection.eventManager.on(EventManager.Event.queryError, queryErrorCallback)
		return () => {
			connection.eventManager.removeListener(EventManager.Event.queryEnd, queryEndCallback)
			connection.eventManager.removeListener(EventManager.Event.queryError, queryErrorCallback)
		}
	}
}
