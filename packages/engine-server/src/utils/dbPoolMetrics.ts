import prom from 'prom-client'
import { Connection } from '@contember/database'
import { ProjectContainer } from '@contember/engine-http'

export const collectDbMetrics = (
	registry: prom.Registry,
	tenantDb: Connection,
	projectContainers: ProjectContainer[],
) => {
	const tenantCollectorInner = createSingleDbPoolMetricsCollector(registry, 'contember_tenant_db_pool')
	const tenantCollector = () => tenantCollectorInner(tenantDb, {})
	const projectCollectorInner = createSingleDbPoolMetricsCollector(registry, 'contember_project_db_pool')
	const collector = () => {
		tenantCollector()
		for (const container of projectContainers) {
			projectCollectorInner(container.connection, { project_name: container.project.slug })
		}
	}
	registry.registerCollector(collector)
}

const createSingleDbPoolMetricsCollector = (registry: prom.Registry, prefix: string) => {
	const totalCount = new prom.Gauge({
		registers: [registry],
		name: `${prefix}_total_count`,
		help: 'The total number of clients existing within the pool.',
		labelNames: ['project_name'],
	})
	const idleCount = new prom.Gauge({
		registers: [registry],
		name: `${prefix}_idle_count`,
		help: 'The number of clients which are not checked out but are currently idle in the pool.',
		labelNames: ['project_name'],
	})
	const waitingCount = new prom.Gauge({
		registers: [registry],
		name: `${prefix}_waiting_count`,
		help:
			'The number of queued requests waiting on a client when all clients are checked out. It can be helpful to monitor this number to see if you need to adjust the size of the pool.',
		labelNames: ['project_name'],
	})
	const maxCount = new prom.Gauge({
		registers: [registry],
		name: `${prefix}_max_count`,
		help: 'Maximum number of clients the pool should contain',
		labelNames: ['project_name'],
	})

	return (db: Connection, labels: { project_name?: string }) => {
		const poolInfo = db.getPoolStatus()
		totalCount.set(labels, poolInfo.totalCount)
		idleCount.set(labels, poolInfo.idleCount)
		waitingCount.set(labels, poolInfo.waitingCount)
		maxCount.set(labels, poolInfo.maxCount)
	}
}
