import { expect, test } from 'bun:test'
import { Client, Connection, EventManager } from '@contember/database'
import { ContentSchemaResolver } from '@contember/engine-http'
import { DatabaseContext, DatabaseContextFactory } from '@contember/engine-system-api'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { Actions } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { noopTracer, ReadableSpan } from '@contember/telemetry'
import { EventDispatcher } from '../../../src/dispatch/EventDispatcher.js'
import { EventsRepository, FetchBatchResult, HoldResult, PersistProcessedResult } from '../../../src/dispatch/EventsRepository.js'
import { TargetHandlerResolver } from '../../../src/dispatch/TargetHandlerResolver.js'
import { HandledEvent, InvokeHandler, InvokeHandlerArgs } from '../../../src/dispatch/types.js'
import { FetcherResponse, WebhookFetcher } from '../../../src/dispatch/WebhookFetcher.js'
import { UndefinedVariableError, WebhookTargetHandler } from '../../../src/dispatch/WebhookTargetHandler.js'
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
	public readonly held: Parameters<EventsRepository['holdForUndefinedVariables']>[1][] = []
	public resumed = 0

	constructor(
		private readonly batch: FetchBatchResult,
		private readonly result: PersistProcessedResult,
		private readonly holdResult: HoldResult = { held: 5, joined: false },
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

	override async holdForUndefinedVariables(db: Client, args: Parameters<EventsRepository['holdForUndefinedVariables']>[1]): Promise<HoldResult> {
		this.held.push(args)
		return this.holdResult
	}

	override async resumeHeldForUndefinedVariables(): Promise<number> {
		this.resumed++
		return 1
	}
}

class StubVariablesManager extends VariablesManager {
	constructor(private readonly variables: VariablesMap[] = [{}]) {
		super({})
	}

	/** Answers with the given maps in turn, the last one from then on. */
	override async fetchVariables(): Promise<VariablesMap> {
		return (this.variables.length > 1 ? this.variables.shift() : this.variables[0]) ?? {}
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

const processBatch = async (dispatcher: EventDispatcher, loggerHandler = new TestLoggerHandler()) =>
	await dispatcher.processBatch({
		db: createDatabaseContext(),
		contentSchemaResolver,
		logger: createLogger(loggerHandler),
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

test('dispatch: an undefined variable holds the whole target back with one warning and no spent attempt', async () => {
	const { exporter, tracer, flush } = createRecordingTracer()
	const loggerHandler = new TestLoggerHandler()
	const repository = new StubEventsRepository(okBatch, { succeeded: 0, retried: 0, failed: 0 })
	const resolver = new StubTargetHandlerResolver(async () => {
		throw new UndefinedVariableError(['TOKEN'])
	})
	const dispatcher = new EventDispatcher(repository, new StubVariablesManager(), resolver, tracer)

	const result = await processBatch(dispatcher, loggerHandler)
	await flush()

	expect(result).toStrictEqual({ succeeded: 0, retried: 0, failedAfterAttempt: 0, failedUnknownTarget: 0, backoffMs: 0 })
	expect(repository.persisted).toStrictEqual([])
	expect(repository.held).toStrictEqual([{ target: 'test_target', batch: events.map(it => it.id), variables: ['TOKEN'] }])
	const reported = loggerHandler.messages.filter(it => it.level.name !== 'debug')
	expect(reported).toHaveLength(1)
	const [warning] = reported
	expect(warning.level.name).toBe('warn')
	expect(warning.message).toBe('Webhook target references an undefined variable, its events wait until it is set')
	expect(warning.loggerAttributes.project).toBe('blog')
	// exact match: the variable names only, never a value
	expect(warning.ownAttributes).toStrictEqual({ target: 'test_target', variables: ['TOKEN'], events: 5 })
	const span = dispatchSpanOf(exporter.spans)
	expect(span.status.code).toBe('unset')
	expect(span.attributes['contember.actions.held']).toBe(5)
	expect(repository.resumed).toBe(0)
})

const undefinedTokenResolver = () =>
	new StubTargetHandlerResolver(async () => {
		throw new UndefinedVariableError(['TOKEN'])
	})

test('dispatch: an event joining a held target is logged at debug level only', async () => {
	const loggerHandler = new TestLoggerHandler()
	const repository = new StubEventsRepository(okBatch, { succeeded: 0, retried: 0, failed: 0 }, { held: 1, joined: true })
	const dispatcher = new EventDispatcher(repository, new StubVariablesManager(), undefinedTokenResolver(), createRecordingTracer().tracer)

	await processBatch(dispatcher, loggerHandler)

	expect(repository.held).toHaveLength(1)
	expect(loggerHandler.messages.filter(it => it.level.name !== 'debug')).toStrictEqual([])
	const joined = loggerHandler.messages.find(it => it.message === 'Webhook target references an undefined variable, its events wait until it is set')
	expect(joined?.ownAttributes).toStrictEqual({ target: 'test_target', variables: ['TOKEN'], events: 1 })
})

test('dispatch: a variable set while the batch was being held releases the hold at once', async () => {
	const repository = new StubEventsRepository(okBatch, { succeeded: 0, retried: 0, failed: 0 })
	// read once for the request, then again after the hold, by when setVariables has committed
	const variablesManager = new StubVariablesManager([{}, { TOKEN: 'secret' }])
	const dispatcher = new EventDispatcher(repository, variablesManager, undefinedTokenResolver(), createRecordingTracer().tracer)

	await processBatch(dispatcher)

	expect(repository.held).toHaveLength(1)
	expect(repository.resumed).toBe(1)
})
