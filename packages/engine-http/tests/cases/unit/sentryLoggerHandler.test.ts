import { describe, expect, test } from 'bun:test'
import { createLogger, LogLevels } from '@contember/logger'
import { createSentryClient, SentryEvent } from '@contember/sentry-client'
import { LoggerRequestBody } from '../../../src/application/index.js'
import { SentryLoggerHandler } from '../../../src/utils/sentry.js'

const setup = () => {
	const events: SentryEvent[] = []
	const client = createSentryClient({
		dsn: 'https://public@sentry.invalid/1',
		contextLines: 0,
		// a fake ingest: the event is the third line of the envelope
		fetch: async (_url, init) => {
			events.push(JSON.parse(String(init.body).split('\n')[2]))
			return new Response('{}')
		},
	})
	const logger = createLogger(new SentryLoggerHandler(LogLevels.warn, client))
	return { logger, events, flush: () => client.flush(2000) }
}

describe('SentryLoggerHandler', () => {
	test('tags an event with both the project group and the project', async () => {
		const { logger, events, flush } = setup()
		logger.child({ projectGroup: 'group', project: 'blog' }).warn(new Error('Webhook request failed'))
		await flush()

		expect(events).toHaveLength(1)
		expect(events[0].tags).toEqual({ projectGroup: 'group', project: 'blog' })
	})

	test('reports the request of the log entry', async () => {
		const { logger, events, flush } = setup()
		const requestLogger = logger.child({
			module: 'content',
			requestId: 'r1',
			user: 'identity-1',
			url: '/content/blog/live',
			traceId: '0af7651916cd43dd8448eb211c80319c',
			spanId: 'b7ad6b7169203331',
			[LoggerRequestBody]: { query: '{ listArticle { id } }', variables: { password: '***' } },
		})
		requestLogger.error(new TypeError('Query failed'))
		await flush()

		expect(events).toHaveLength(1)
		expect(events[0]).toMatchObject({
			level: 'error',
			tags: { module: 'content' },
			user: { id: 'identity-1' },
			extra: { requestId: 'r1' },
			request: { url: '/content/blog/live', data: { query: '{ listArticle { id } }', variables: { password: '***' } } },
			contexts: { trace: { trace_id: '0af7651916cd43dd8448eb211c80319c', span_id: 'b7ad6b7169203331' } },
		})
		expect(events[0].exception?.values.at(-1)).toMatchObject({ type: 'TypeError', value: 'Query failed' })
	})

	test('maps the log level', async () => {
		const { logger, events, flush } = setup()
		logger.warn(new Error('warn'))
		logger.error(new Error('error'))
		logger.crit(new Error('crit'))
		await flush()

		expect(events.map(it => it.level)).toEqual(['warning', 'error', 'fatal'])
		expect(events.every(it => it.contexts?.trace === undefined)).toBe(true)
	})

	test('ignores entries without an error and entries below warn', async () => {
		const { logger, events, flush } = setup()
		logger.warn('only a message')
		logger.info(new Error('info'))
		await flush()

		expect(events).toEqual([])
	})
})
