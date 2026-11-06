import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import http from 'node:http'
import { createEgressGuard } from '@contember/engine-common'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { Actions } from '@contember/schema'
import { noopTracer } from '@contember/telemetry'
import { createWebhookFetcher } from '../../../src/dispatch/WebhookFetcher.js'
import { WebhookTargetHandler } from '../../../src/dispatch/WebhookTargetHandler.js'
import { createTestEvent } from '../../src/event.js'

describe('webhook delivery and the egress guard', () => {
	let server: http.Server
	let port: number
	let received = 0
	// The test preload replaces the global `fetch` with a DOM one; the engine runs with the runtime's own.
	let preloadFetch: typeof fetch

	beforeAll(async () => {
		preloadFetch = globalThis.fetch
		globalThis.fetch = Bun.fetch
		server = http.createServer((req, res) => {
			received++
			req.resume()
			res.writeHead(200).end()
		})
		// All interfaces: `localhost` may resolve to ::1 first.
		await new Promise<void>(resolve => server.listen(0, resolve))
		const address = server.address()
		if (address === null || typeof address === 'string') {
			throw new Error('expected a TCP address')
		}
		port = address.port
	})

	afterAll(() => {
		globalThis.fetch = preloadFetch
		server.close()
	})

	const deliver = async (guard: ReturnType<typeof createEgressGuard>) => {
		const handler = new WebhookTargetHandler(createWebhookFetcher(guard), noopTracer, { propagateToWebhooks: false })
		const target: Actions.AnyTarget = { name: 'local_target', type: 'webhook', url: `http://localhost:${port}/hook` }
		const [handled] = await handler.handle({
			logger: createLogger(new TestLoggerHandler()),
			target,
			events: [createTestEvent(0)],
			variables: {},
		})
		return handled.result
	}

	test('without the guard (the default), a local http webhook is delivered', async () => {
		const before = received
		const result = await deliver(createEgressGuard(undefined))
		expect(result.ok).toBe(true)
		expect(result.code).toBe(200)
		expect(received).toBe(before + 1)
	})

	test('with the guard, a webhook to a non-public address fails as a delivery error', async () => {
		const before = received
		const result = await deliver(createEgressGuard({ guard: true, allowHttp: true }))
		expect(result.ok).toBe(false)
		expect(result.errorMessage).toContain('resolves to the non-public address')
		expect(received).toBe(before)
	})

	test('with the guard, an http webhook is refused unless http is allowed', async () => {
		const result = await deliver(createEgressGuard({ guard: true, allowlist: ['localhost'] }))
		expect(result.ok).toBe(false)
		expect(result.errorMessage).toContain('Only https:// URLs are allowed')
	})

	test('with the guard, an allow-listed internal host is delivered', async () => {
		const before = received
		const result = await deliver(createEgressGuard({ guard: true, allowHttp: true, allowlist: ['localhost'] }))
		expect(result.ok).toBe(true)
		expect(received).toBe(before + 1)
	})
})
