import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import http from 'node:http'
import { AddressInfo } from 'node:net'
import { EgressGuard, EgressPolicy } from '../../../src/index.js'

type RecordedRequest = { method: string; url: string; headers: http.IncomingHttpHeaders; body: string }

const startServer = async (handler: (req: http.IncomingMessage, res: http.ServerResponse) => void) => {
	const requests: RecordedRequest[] = []
	const server = http.createServer((req, res) => {
		let body = ''
		req.on('data', chunk => (body += chunk))
		req.on('end', () => {
			requests.push({ method: req.method ?? '', url: req.url ?? '', headers: req.headers, body })
			handler(req, res)
		})
	})
	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
	const port = (server.address() as AddressInfo).port
	return { server, port, requests }
}

const guardWith = (allowlist: string[]) => new EgressGuard(new EgressPolicy({ allowHttp: true, allowlist }))

describe('EgressGuard.fetch', () => {
	let target: Awaited<ReturnType<typeof startServer>>
	let redirector: Awaited<ReturnType<typeof startServer>>

	beforeAll(async () => {
		target = await startServer((req, res) => {
			res.writeHead(201, 'Created', { 'content-type': 'application/json', 'x-test': 'yes' })
			res.end(JSON.stringify({ ok: true }))
		})
		redirector = await startServer((req, res) => {
			const status = Number(new URL(req.url ?? '/', 'http://x').searchParams.get('status') ?? 307)
			res.writeHead(status, { location: `http://127.0.0.1:${target.port}/landed` })
			res.end()
		})
	})

	afterAll(() => {
		target.server.close()
		redirector.server.close()
	})

	test('a host name that resolves to a non-public address is refused before connecting', async () => {
		const before = target.requests.length
		const guard = guardWith([])
		await expect(guard.fetch(`http://localhost:${target.port}/hook`, { method: 'POST', body: '{}' })).rejects.toThrow('non-public address')
		expect(target.requests.length).toBe(before)
		guard.dispose()
	})

	test('http is refused unless allowed', async () => {
		const guard = new EgressGuard(new EgressPolicy({ allowHttp: false, allowlist: ['localhost'] }))
		await expect(guard.fetch(`http://localhost:${target.port}/hook`, {})).rejects.toThrow('Only https:// URLs are allowed')
		guard.dispose()
	})

	test('an allow-listed local host is reached and its response returned', async () => {
		const guard = guardWith(['localhost'])
		const response = await guard.fetch(`http://localhost:${target.port}/hook`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', 'x-token': 'secret' },
			body: '{"a":1}',
		})
		expect(response.status).toBe(201)
		expect(response.statusText).toBe('Created')
		expect(response.headers.get('x-test')).toBe('yes')
		expect(await response.json()).toEqual({ ok: true })
		const received = target.requests.at(-1)
		expect(received?.method).toBe('POST')
		expect(received?.body).toBe('{"a":1}')
		expect(received?.headers['x-token']).toBe('secret')
		guard.dispose()
	})

	test('a redirect to a non-public address is refused', async () => {
		const before = target.requests.length
		const guard = guardWith(['localhost'])
		await expect(guard.fetch(`http://localhost:${redirector.port}/`, { method: 'POST', body: '{}' })).rejects.toThrow('non-public address')
		expect(target.requests.length).toBe(before)
		guard.dispose()
	})

	test('an allowed redirect keeps a 307 POST and drops credentials across origins', async () => {
		const guard = guardWith(['localhost', '127.0.0.1'])
		const response = await guard.fetch(`http://localhost:${redirector.port}/?status=307`, {
			method: 'POST',
			headers: { 'authorization': 'Bearer secret', 'x-other': 'kept' },
			body: '{"a":1}',
		})
		expect(response.status).toBe(201)
		const received = target.requests.at(-1)
		expect(received?.url).toBe('/landed')
		expect(received?.method).toBe('POST')
		expect(received?.body).toBe('{"a":1}')
		expect(received?.headers.authorization).toBeUndefined()
		expect(received?.headers['x-other']).toBe('kept')
		guard.dispose()
	})

	test('a 302 after a POST continues as a GET without a body', async () => {
		const guard = guardWith(['localhost', '127.0.0.1'])
		await guard.fetch(`http://localhost:${redirector.port}/?status=302`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: '{}',
		})
		const received = target.requests.at(-1)
		expect(received?.method).toBe('GET')
		expect(received?.body).toBe('')
		expect(received?.headers['content-type']).toBeUndefined()
		guard.dispose()
	})

	test('a manual redirect is returned as is', async () => {
		const guard = guardWith(['localhost'])
		const response = await guard.fetch(`http://localhost:${redirector.port}/`, { redirect: 'manual' })
		expect(response.status).toBe(307)
		guard.dispose()
	})

	test('an aborted request rejects with the abort reason', async () => {
		const hanging = await startServer(() => {})
		const guard = guardWith(['localhost'])
		const controller = new AbortController()
		const pending = guard.fetch(`http://localhost:${hanging.port}/`, { signal: controller.signal })
		setTimeout(() => controller.abort(new Error('timed out')), 50)
		await expect(pending).rejects.toThrow('timed out')
		guard.dispose()
		hanging.server.closeAllConnections()
		hanging.server.close()
	})
})

describe('EgressGuard.httpOptions', () => {
	test('refuses a disallowed URL before a client issues the request', () => {
		const guard = new EgressGuard(new EgressPolicy({ allowHttp: false, allowlist: [] }))
		expect(() => guard.httpOptions(new URL('http://example.com/'))).toThrow('Only https:// URLs are allowed')
		expect(() => guard.httpOptions(new URL('https://169.254.169.254/'))).toThrow('non-public address')
		expect(guard.httpOptions(new URL('https://example.com/')).lookup).toBeFunction()
		guard.dispose()
	})
})
