import { afterAll, beforeAll, expect, test } from 'bun:test'
import * as Sentry from '@sentry/node'
import { createLogger, LogLevels } from '@contember/logger'
import { SentryLoggerHandler } from '../../../src/utils/sentry.js'

const captured: Sentry.Event[] = []

beforeAll(() => {
	Sentry.init({
		dsn: 'https://public@sentry.invalid/1',
		defaultIntegrations: false,
		beforeSend: event => {
			captured.push(event)
			return null
		},
	})
})

afterAll(async () => {
	await Sentry.close()
})

test('tags an event with both the project group and the project', async () => {
	const logger = createLogger(new SentryLoggerHandler(LogLevels.warn)).child({ projectGroup: 'group', project: 'blog' })

	logger.warn(new Error('Webhook request failed'))
	await Sentry.flush(1_000)

	expect(captured).toHaveLength(1)
	expect(captured[0].tags).toMatchObject({ projectGroup: 'group', project: 'blog' })
})
