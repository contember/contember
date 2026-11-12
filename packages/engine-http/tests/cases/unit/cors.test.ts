import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import Koa from 'koa'
import { IncomingHttpHeaders, request, Server } from 'node:http'
import { createCorsMiddleware } from '../../../src/application/cors.js'

type Response = { status: number; headers: IncomingHttpHeaders; body: string }

// node:http instead of fetch: the test preload installs a browser fetch that enforces CORS itself.
const send = (port: number, path: string, method: string, headers: Record<string, string> = {}): Promise<Response> =>
	new Promise((resolve, reject) => {
		const req = request({ host: '127.0.0.1', port, path, method, headers }, res => {
			let body = ''
			res.setEncoding('utf8')
			res.on('data', chunk => body += chunk)
			res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }))
		})
		req.on('error', reject)
		req.end()
	})

describe('CORS middleware', () => {
	let server: Server
	let port: number

	beforeAll(async () => {
		const koa = new Koa()
		koa.silent = true
		koa.use(createCorsMiddleware({ exposeHeaders: ['X-Contember-Mutation'] }))
		koa.use(async ctx => {
			if (ctx.path === '/fail-plain') {
				throw Object.assign(new Error('boom'), { status: 409, expose: true })
			}
			if (ctx.path === '/fail') {
				throw Object.assign(new Error('boom'), { status: 418, expose: true, headers: { 'X-Custom': 'kept', Vary: 'Accept' } })
			}
			ctx.set('X-Contember-Mutation', 'ok')
			ctx.body = { method: ctx.method }
		})
		server = koa.listen(0)
		await new Promise(resolve => server.once('listening', resolve))
		const address = server.address()
		if (address === null || typeof address === 'string') {
			throw new Error('Expected a TCP address')
		}
		port = address.port
	})

	afterAll(() => {
		server.close()
	})

	test('simple request gets allow-origin and expose-headers', async () => {
		const response = await send(port, '/', 'POST', { Origin: 'https://example.com' })
		expect(response.status).toBe(200)
		expect(response.headers['access-control-allow-origin']).toBe('*')
		expect(response.headers['access-control-expose-headers']).toBe('X-Contember-Mutation')
		expect(response.headers['access-control-allow-credentials']).toBeUndefined()
		expect(response.headers['vary']).toBe('Origin')
		expect(JSON.parse(response.body)).toEqual({ method: 'POST' })
	})

	test('preflight answers 204 and echoes the requested headers', async () => {
		const response = await send(port, '/', 'OPTIONS', {
			Origin: 'https://example.com',
			'Access-Control-Request-Method': 'POST',
			'Access-Control-Request-Headers': 'authorization,content-type',
		})
		expect(response.status).toBe(204)
		expect(response.headers['access-control-allow-origin']).toBe('*')
		expect(response.headers['access-control-allow-methods']).toBe('GET,HEAD,PUT,POST,DELETE,PATCH')
		expect(response.headers['access-control-allow-headers']).toBe('authorization,content-type')
		expect(response.headers['access-control-expose-headers']).toBeUndefined()
		expect(response.headers['vary']).toBe('Origin')
		expect(response.body).toBe('')
	})

	test('preflight without requested headers sets no allow-headers', async () => {
		const response = await send(port, '/', 'OPTIONS', { 'Access-Control-Request-Method': 'GET' })
		expect(response.status).toBe(204)
		expect(response.headers['access-control-allow-headers']).toBeUndefined()
	})

	test('OPTIONS without request method is not a preflight', async () => {
		const response = await send(port, '/', 'OPTIONS')
		expect(response.status).toBe(200)
		expect(response.headers['access-control-allow-origin']).toBeUndefined()
		expect(JSON.parse(response.body)).toEqual({ method: 'OPTIONS' })
	})

	test('CORS headers survive a thrown error', async () => {
		const response = await send(port, '/fail', 'GET', { Origin: 'https://example.com' })
		expect(response.status).toBe(418)
		expect(response.headers['access-control-allow-origin']).toBe('*')
		expect(response.headers['access-control-expose-headers']).toBe('X-Contember-Mutation')
		expect(response.headers['x-custom']).toBe('kept')
		expect(response.headers['vary']).toBe('Accept, Origin')
	})

	test('CORS headers survive a thrown error without own headers', async () => {
		const response = await send(port, '/fail-plain', 'GET', { Origin: 'https://example.com' })
		expect(response.status).toBe(409)
		expect(response.headers['access-control-allow-origin']).toBe('*')
		expect(response.headers['access-control-expose-headers']).toBe('X-Contember-Mutation')
		expect(response.headers['vary']).toBe('Origin')
	})
})
