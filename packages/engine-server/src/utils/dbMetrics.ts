import prom from 'prom-client'
import { Connection, EventManager } from '@contember/database'
import { ProjectContainer } from '@contember/engine-http'

export const registerDbMetrics = (
	registry: prom.Registry,
	tenantDb: Connection.PoolStatusProvider & Connection.Queryable,
	projectContainers: ProjectContainer[],
) => {
	registerDbPoolCollector(registry, tenantDb, projectContainers)
	createSqlMetrics(registry, tenantDb, projectContainers)
}

export const registerDbPoolCollector = (
	registry: prom.Registry,
	tenantDb: Connection.PoolStatusProvider & Connection.Queryable,
	projectContainers: ProjectContainer[],
) => {
	const dbPoolCollectorInner = createSingleDbPoolMetricsCollector(registry)
	const collector = () => {
		dbPoolCollectorInner(tenantDb, { contember_module: 'tenant', contember_project: 'unknown' })
		for (const container of projectContainers) {
			dbPoolCollectorInner(tenantDb, { contember_module: 'content', contember_project: container.project.slug })
		}
	}
	registry.registerCollector(collector)
}

const createSingleDbPoolMetricsCollector = (registry: prom.Registry) => {
	const labelNames = ['contember_project', 'contember_module']
	const totalCount = new prom.Gauge({
		registers: [registry],
		name: `contember_db_pool_total_count`,
		help: 'The total number of clients existing within the pool by contember_module (tenant or content; system is not used since it uses the same connection) and contember_project for contember_module=content.',
		labelNames: labelNames,
	})
	const idleCount = new prom.Gauge({
		registers: [registry],
		name: `contember_db_pool_idle_count`,
		help: 'The number of clients which are not checked out but are currently idle in the pool by contember_module (tenant or content; system is not used since it uses the same connection) and contember_project for contember_module=content.',
		labelNames: labelNames,
	})
	const waitingCount = new prom.Gauge({
		registers: [registry],
		name: `contember_db_pool_waiting_count`,
		help: 'The number of queued requests waiting on a client when all clients are checked out. It can be helpful to monitor this number to see if you need to adjust the size of the pool by contember_module (tenant or content; system is not used since it uses the same connection) and contember_project for contember_module=content.',
		labelNames: labelNames,
	})
	const maxCount = new prom.Gauge({
		registers: [registry],
		name: `contember_db_pool_max_count`,
		help: 'Maximum number of clients the pool should contain by contember_module (tenant or content; system is not used since it uses the same connection) and contember_project for contember_module=content.',
		labelNames: labelNames,
	})

	return (db: Connection.PoolStatusProvider, labels: { contember_module: string; contember_project: string }) => {
		const poolInfo = db.getPoolStatus()
		totalCount.set(labels, poolInfo.totalCount)
		idleCount.set(labels, poolInfo.idleCount)
		waitingCount.set(labels, poolInfo.waitingCount)
		maxCount.set(labels, poolInfo.maxCount)
	}
}

const createSqlMetrics = (
	registry: prom.Registry,
	tenantDb: Connection.Queryable,
	projectContainers: ProjectContainer[],
) => {
	const sqlDuration = new prom.Histogram({
		name: 'contember_sql_duration_ms',
		help: 'Executed SQL queries by contember_module (system, tenant, content or unknown) and contember_project (or "unknown" for unknown project)',
		registers: [registry],
		labelNames: ['contember_project', 'contember_module'],
		buckets: [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000],
	})
	const sqlErrorRate = new prom.Counter({
		name: 'contember_sql_error_count',
		help: 'Failed SQL queries by contember_module (system, tenant, content or unknown) and contember_project (or "unknown" for unknown project)',
		labelNames: ['contember_project', 'contember_module'],
		registers: [registry],
	})

	const registerListeners = (
		connection: Connection.Queryable,
		labels: { contember_module?: string; contember_project?: string },
	) => {
		connection.eventManager.on(EventManager.Event.queryEnd, ({ meta }, { timing }) => {
			sqlDuration.observe(
				{
					contember_module: labels.contember_module || meta.module || 'unknown',
					contember_project: labels.contember_project || 'unknown',
				},
				timing ? timing.selfDuration / 1000 : 0,
			)
		})
		connection.eventManager.on(EventManager.Event.queryError, ({ meta }) => {
			sqlErrorRate.inc({
				contember_module: labels.contember_module || meta.module || 'unknown',
				contember_project: labels.contember_project || 'unknown',
			})
		})
	}

	registerListeners(tenantDb, { contember_module: 'tenant' })
	for (const container of projectContainers) {
		registerListeners(container.connection, { contember_project: container.project.slug })
	}
}
