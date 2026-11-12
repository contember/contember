import { createServer, IncomingHttpHeaders } from 'node:http'
import { SentryEvent } from '../../../src/types.js'

export interface ReceivedEnvelope {
	readonly method: string
	readonly url: string
	readonly headers: IncomingHttpHeaders
	readonly header: { event_id: string; sent_at: string; sdk: { name: string; version: string } }
	readonly itemHeader: { type: string }
	readonly event: SentryEvent
}

export interface IngestResponse {
	readonly status?: number
	readonly headers?: Record<string, string>
	/** Answer only after this long. */
	readonly delayMs?: number
}

export interface FakeIngest {
	readonly dsn: string
	readonly received: ReceivedEnvelope[]
	/** Resolves once `count` envelopes have arrived. */
	waitFor(count: number): Promise<ReceivedEnvelope[]>
	stop(): Promise<void>
}

/**
 * An HTTP server standing in for Sentry: it parses each envelope it receives and answers with `respond`.
 * node:http, because the happy-dom globals of the test preload replace `Response`, which Bun.serve then rejects.
 */
export const startFakeIngest = async (respond: (envelope: ReceivedEnvelope) => IngestResponse = () => ({})): Promise<FakeIngest> => {
	const received: ReceivedEnvelope[] = []
	const waiters: { count: number; resolve: () => void }[] = []
	const server = createServer((request, response) => {
		const chunks: Buffer[] = []
		request.on('data', (chunk: Buffer) => chunks.push(chunk))
		request.on('end', () => {
			const [header, itemHeader, event] = Buffer.concat(chunks).toString('utf8').split('\n').map(line => JSON.parse(line))
			const envelope: ReceivedEnvelope = { method: request.method ?? '', url: request.url ?? '', headers: request.headers, header, itemHeader, event }
			received.push(envelope)
			for (const waiter of waiters.filter(it => received.length >= it.count)) {
				waiter.resolve()
			}
			const { status = 200, headers = {}, delayMs = 0 } = respond(envelope)
			setTimeout(() => response.writeHead(status, headers).end('{}'), delayMs)
		})
	})
	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
	const address = server.address()
	if (address === null || typeof address === 'string') {
		throw new Error('The fake ingest is not listening on a TCP port')
	}
	return {
		dsn: `http://public@127.0.0.1:${address.port}/42`,
		received,
		waitFor: count =>
			received.length >= count
				? Promise.resolve(received)
				: new Promise(resolve => waiters.push({ count, resolve: () => resolve(received) })),
		stop: () =>
			new Promise(resolve => {
				server.closeAllConnections()
				server.close(() => resolve())
			}),
	}
}
