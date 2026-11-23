import { expect, test } from 'bun:test'
import { Connection, EventManager } from '@contember/database'
import { ContentSchemaResolver } from '@contember/engine-http'
import { DatabaseContext, DatabaseContextFactory } from '@contember/engine-system-api'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { emptySchema } from '@contember/schema-utils'
import { Registry } from 'prom-client'
import { ActionsMetrics } from '../../../src/ActionsMetrics.js'
import { EventDispatcher } from '../../../src/dispatch/EventDispatcher.js'
import { ProjectDispatcher, ProjectDispatcherFactory } from '../../../src/dispatch/ProjectDispatcher.js'
import { createMock } from '../../src/utils.js'
import { testUuid } from '../../src/uuid.js'

type ProcessBatchResult = Awaited<ReturnType<EventDispatcher['processBatch']>>

const emptyQueue: ProcessBatchResult = { succeeded: 0, retried: 0, failedAfterAttempt: 0, failedUnknownTarget: 0, backoffMs: undefined }
const processedBatch: ProcessBatchResult = { succeeded: 2, retried: 0, failedAfterAttempt: 0, failedUnknownTarget: 0, backoffMs: 0 }

const createDatabaseContext = (): DatabaseContext => {
	const eventManager = new EventManager()
	// The listener issues LISTEN / UNLISTEN only, the dispatcher itself is stubbed.
	const query = async () => ({ rowCount: 0, rows: [] })
	const transaction: Connection.TransactionLike = {
		eventManager,
		isClosed: false,
		query,
		scope: cb => Promise.resolve(cb(transaction)),
		transaction: cb => Promise.resolve(cb(transaction)),
		on: () => () => {},
		rollback: async () => {},
		commit: async () => {},
	}
	const connection: Connection.ConnectionLike = {
		eventManager,
		query,
		scope: cb => Promise.resolve(cb(transaction)),
		transaction: cb => Promise.resolve(cb(transaction)),
	}
	return new DatabaseContextFactory('system', { uuid: () => testUuid(1) }).create(connection)
}

const contentSchemaResolver = createMock<ContentSchemaResolver>({
	clearCache: () => {},
	getSchema: async () => ({ schema: emptySchema, meta: {} }),
})

const startDispatcher = async (processBatch: () => Promise<ProcessBatchResult>, endTimeoutMs: number) => {
	const loggerHandler = new TestLoggerHandler()
	const dispatcher = new ProjectDispatcher(
		createMock<EventDispatcher>({ processBatch }),
		createDatabaseContext(),
		contentSchemaResolver,
		'blog',
		new ActionsMetrics(new Registry()).forProject('blog'),
		{ endTimeoutMs },
	)
	const running = await dispatcher.run({
		logger: createLogger(loggerHandler),
		onError: e => {
			throw e
		},
	})
	const warnings = () => loggerHandler.messages.filter(it => it.level.name === 'warn').map(it => it.message)
	return { running, warnings }
}

const measure = async (cb: () => Promise<void>): Promise<number> => {
	const startedAt = Date.now()
	await cb()
	return Date.now() - startedAt
}

test('end() returns promptly while the loop waits for a notification', async () => {
	let batchCount = 0
	const { running, warnings } = await startDispatcher(async () => {
		batchCount++
		return emptyQueue
	}, 5_000)
	await new Promise(resolve => setTimeout(resolve, 10))

	expect(await measure(() => running.end())).toBeLessThan(500)
	expect(batchCount).toBe(1)
	expect(warnings()).toEqual([])
})

test('end() returns promptly while the loop waits for a retry backoff', async () => {
	const { running, warnings } = await startDispatcher(async () => ({ ...emptyQueue, backoffMs: 20_000 }), 5_000)
	await new Promise(resolve => setTimeout(resolve, 10))

	expect(await measure(() => running.end())).toBeLessThan(500)
	expect(warnings()).toEqual([])
})

test('end() waits for a short in-flight batch to finish', async () => {
	const steps: string[] = []
	const { running, warnings } = await startDispatcher(async () => {
		await new Promise(resolve => setTimeout(resolve, 50))
		steps.push('batch finished')
		return processedBatch
	}, 5_000)

	await running.end()
	steps.push('end resolved')

	expect(steps).toEqual(['batch finished', 'end resolved'])
	expect(warnings()).toEqual([])
})

test('end() gives up on a hanging batch after the timeout', async () => {
	const { running, warnings } = await startDispatcher(() => new Promise<ProcessBatchResult>(() => {}), 50)

	expect(await measure(() => running.end())).toBeLessThan(1_000)
	expect(warnings()).toEqual(['Worker did not finish its batch in time, events still in processing will be delivered again'])
})

const blogSeries = (registry: Registry, metric: string) =>
	registry.getSingleMetricAsString(metric).split('\n').filter(line => line.startsWith(`${metric}{contember_project="blog"}`))

const hasHeartbeat = (registry: Registry) => blogSeries(registry, 'contember_actions_worker_heartbeat_timestamp_seconds').length > 0

const hasCrashed = (registry: Registry) => blogSeries(registry, 'contember_actions_worker_crashed_total').length > 0

const startSupervisedDispatcher = async (metrics: ActionsMetrics, processBatch: () => Promise<ProcessBatchResult>) => {
	const factory = new ProjectDispatcherFactory(createMock<EventDispatcher>({ processBatch }), metrics)
	return await factory.create({
		db: createDatabaseContext(),
		contentSchemaResolver,
		projectSlug: 'blog',
		supervisorOptions: { startupMax: 10 },
	}).run({
		logger: createLogger(new TestLoggerHandler()),
		onError: e => {
			throw e
		},
	})
}

test('ending a running supervised worker removes its heartbeat series', async () => {
	const registry = new Registry()
	const running = await startSupervisedDispatcher(new ActionsMetrics(registry), async () => emptyQueue)
	await new Promise(resolve => setTimeout(resolve, 10))
	expect(hasHeartbeat(registry)).toBe(true)

	await running.end()

	expect(hasHeartbeat(registry)).toBe(false)
})

test('ending a worker that crashed and waits for a restart removes its heartbeat series', async () => {
	// A dropped project: its system schema disappears first, the loop crashes, then the project removal ends the worker.
	const registry = new Registry()
	const running = await startSupervisedDispatcher(new ActionsMetrics(registry), async () => {
		throw new Error('relation "p_blog_system.schema" does not exist')
	})
	for (let i = 0; i < 100 && !hasCrashed(registry); i++) {
		await new Promise(resolve => setTimeout(resolve, 5))
	}
	expect(blogSeries(registry, 'contember_actions_worker_crashed_total')).toEqual([
		'contember_actions_worker_crashed_total{contember_project="blog"} 1',
	])
	expect(hasHeartbeat(registry)).toBe(true)

	expect(await measure(() => running.end())).toBeLessThan(500)

	expect(hasHeartbeat(registry)).toBe(false)
})
