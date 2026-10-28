import { expect, test } from 'bun:test'
import { Connection, EventManager } from '@contember/database'
import { Registry } from 'prom-client'
import { createMock } from '../../utils.js'
import { createDbMetricsRegistrar } from '../../../src/prometheus/dbMetrics.js'

const labels = (project: string) => ({
	contember_module: 'content',
	contember_project: project,
	contember_project_group: 'group',
	database_instance: 'single',
})

test('a pool without status does not hide metrics of the other pools', async () => {
	const registry = new Registry()
	const register = createDbMetricsRegistrar(registry)
	register({
		connection: createMock<Connection.PoolStatusProvider & Connection.Queryable>({
			getPoolStatus: () => undefined,
			eventManager: new EventManager(null),
			query: () => {
				throw new Error('Unused test dependency')
			},
		}),
		labels: labels('without-status'),
	})
	register({
		connection: Connection.create(
			{ host: 'localhost', port: 5432, user: 'test', password: 'test', database: 'test', pool: { maxConnections: 7 } },
			() => {},
		),
		labels: labels('with-status'),
	})

	const maxCount = (await registry.metrics()).split('\n').filter(it => it.startsWith('contember_db_pool_max_count{'))

	expect(maxCount).toEqual([
		'contember_db_pool_max_count{contember_module="content",contember_project="with-status",contember_project_group="group",database_instance="single"} 7',
	])
})
