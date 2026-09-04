import { expect, test } from 'bun:test'
import { Client, Connection, EventManager } from '@contember/database'
import { ContentSchemaResolver } from '@contember/engine-http'
import { DatabaseContext, DatabaseContextFactory } from '@contember/engine-system-api'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { Actions } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { noopTracer, ReadableSpan } from '@contember/telemetry'
import { EventDispatcher } from '../../../src/dispatch/EventDispatcher.js'
import { EventsRepository, FetchBatchResult, PersistProcessedResult } from '../../../src/dispatch/EventsRepository.js'
import { TargetHandlerResolver } from '../../../src/dispatch/TargetHandlerResolver.js'
import { HandledEvent, InvokeHandler, InvokeHandlerArgs } from '../../../src/dispatch/types.js'
import { FetcherResponse, WebhookFetcher } from '../../../src/dispatch/WebhookFetcher.js'
import { WebhookTargetHandler } from '../../../src/dispatch/WebhookTargetHandler.js'
import { VariablesManager, VariablesMap } from '../../../src/model/VariablesManager.js'
import { createTestEvent } from '../../src/event.js'
import { createRecordingTracer } from '../../src/tracer.js'
import { testUuid } from '../../src/uuid.js'
import { createMock } from '../../src/utils.js'

const target: Actions.WebhookTarget = {
	name: 'test_target',
	type: 'webhook',
	url: 'http://localhost/hook',
}

const events = [createTestEvent(0), createTestEvent(1)]

const okBatch: FetchBatchResult = { ok: true, events, target, unknownTargetFailed: 0 }
const idleBatch: FetchBatchResult = { ok: false, backoffMs: 100, unknownTargetFailed: 0 }

class StubEventsRepository extends EventsRepository {
	public readonly persisted: HandledEvent[][] = []

	constructor(
		private readonly batch: FetchBatchResult,
		private readonly result: PersistProcessedResult,
	) {
		super()
	}

	override async fetchBatch(): Promise<FetchBatchResult> {
		return this.batch
	}

	override async persistProcessed(db: Client, handled: HandledEvent[]): Promise<PersistProcessedResult> {
		this.persisted.push(handled)
		return this.result
	}
}

class StubVariablesManager extends VariablesManager {
	constructor() {
		super({})
	}

	override async fetchVariables(): Promise<VariablesMap> {
		return {}
	}
}

class StubTargetHandlerResolver extends TargetHandlerResolver {
	constructor(
		private readonly handleEvents: (args: InvokeHandlerArgs<Actions.AnyTarget>) => Promise<HandledEvent[]>,
	) {
		super(new WebhookTargetHandler(unusedFetcher, noopTracer, { propagateToWebhooks: false }))
	}

	override resolveHandler<T extends Actions.AnyTarget>(): InvokeHandler<T> {
		return { handle: this.handleEvents }
	}
}

const unusedFetcher: WebhookFetcher = {
	fetch: async () => {
		throw new Error('the webhook fetcher is not used in this test')
	},
}

const createDatabaseContext = (): DatabaseContext => {
	const eventManager = new EventManager()
	const query = async () => {
		throw new Error('no query is expected in this test')
	}
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

const processBatch = async (dispatcher: EventDispatcher) =>
	await dispatcher.processBatch({
		db: createDatabaseContext(),
		contentSchemaResolver,
		logger: createLogger(new TestLoggerHandler()),
		project: { slug: 'blog' },
	})

const dispatchSpanOf = (spans: readonly ReadableSpan[]): ReadableSpan => {
	const span = spans.find(it => it.name === 'actions.dispatch')
	if (span === undefined) {
		throw new Error('no actions.dispatch span was exported')
	}
	return span
}

test('dispatch: a processed batch is one consumer span carrying the result counts', async () => {
	const { exporter, tracer, flush } = createRecordingTracer()
	const repository = new StubEventsRepository(okBatch, { succeeded: 2, retried: 0, failed: 0 })
	const resolver = new StubTargetHandlerResolver(async ({ events }) => events.map(row => ({ row, target, result: { ok: true } })))
	const dispatcher = new EventDispatcher(repository, new StubVariablesManager(), resolver, tracer)

	const result = await processBatch(dispatcher)
	await flush()

	expect(result.succeeded).toBe(2)
	const span = dispatchSpanOf(exporter.spans)
	expect(span.kind).toBe('consumer')
	expect(span.parentSpanId).toBeUndefined()
	expect(span.status.code).toBe('unset')
	expect(span.attributes['contember.project']).toBe('blog')
	expect(span.attributes['contember.actions.target']).toBe('test_target')
	expect(span.attributes['contember.actions.batch_id']).toBeTypeOf('string')
	expect(span.attributes['contember.actions.events']).toBe(2)
	expect(span.attributes['contember.actions.succeeded']).toBe(2)
	expect(span.attributes['contember.actions.retried']).toBe(0)
	expect(span.attributes['contember.actions.failed']).toBe(0)
})

test('dispatch: an idle poll produces no span at all', async () => {
	const { exporter, tracer, flush } = createRecordingTracer()
	const repository = new StubEventsRepository(idleBatch, { succeeded: 0, retried: 0, failed: 0 })
	const resolver = new StubTargetHandlerResolver(async () => [])
	const dispatcher = new EventDispatcher(repository, new StubVariablesManager(), resolver, tracer)

	const result = await processBatch(dispatcher)
	await flush()

	expect(result.backoffMs).toBe(100)
	expect(exporter.spans).toStrictEqual([])
})

test('dispatch: a handler failure marks the span while the batch is still persisted', async () => {
	const { exporter, tracer, flush } = createRecordingTracer()
	const repository = new StubEventsRepository(okBatch, { succeeded: 0, retried: 2, failed: 0 })
	const resolver = new StubTargetHandlerResolver(async () => {
		throw new Error('handler exploded')
	})
	const dispatcher = new EventDispatcher(repository, new StubVariablesManager(), resolver, tracer)

	const result = await processBatch(dispatcher)
	await flush()

	expect(result.retried).toBe(2)
	expect(repository.persisted).toHaveLength(1)
	expect(repository.persisted[0].every(it => !it.result.ok)).toBe(true)
	const span = dispatchSpanOf(exporter.spans)
	expect(span.status.code).toBe('error')
	expect(span.status.message).toBeUndefined()
	expect(span.events.map(it => it.name)).toStrictEqual(['exception'])
	expect(span.attributes['contember.actions.retried']).toBe(2)
})

test('dispatch: the webhook span nests under the dispatch span', async () => {
	const { exporter, tracer, flush } = createRecordingTracer()
	const okResponse: FetcherResponse = { ok: true, headers: new Headers(), responseText: '', status: 200, statusText: 'OK' }
	const requests: Headers[] = []
	const fetcher: WebhookFetcher = {
		fetch: async (url, init) => {
			requests.push(new Headers(init.headers))
			return okResponse
		},
	}
	const repository = new StubEventsRepository(okBatch, { succeeded: 2, retried: 0, failed: 0 })
	const resolver = new TargetHandlerResolver(new WebhookTargetHandler(fetcher, tracer, { propagateToWebhooks: true }))
	const dispatcher = new EventDispatcher(repository, new StubVariablesManager(), resolver, tracer)

	await processBatch(dispatcher)
	await flush()

	const dispatchSpan = dispatchSpanOf(exporter.spans)
	const webhookSpan = exporter.spans.find(it => it.name === 'webhook')
	expect(webhookSpan?.parentSpanId).toBe(dispatchSpan.context.spanId)
	expect(webhookSpan?.context.traceId).toBe(dispatchSpan.context.traceId)
	expect(requests[0].get('traceparent')).toContain(dispatchSpan.context.traceId)
})
