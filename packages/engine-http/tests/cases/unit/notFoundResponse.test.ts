import { afterAll, beforeAll, expect, test } from 'bun:test'
import Koa from 'koa'
import { AddressInfo } from 'node:net'
import { Server } from 'node:http'
import prom from 'prom-client'
import { createNotFoundMiddleware } from '../../../src/common'
import { createShowMetricsMiddleware } from '../../../src/prometheus'

// Mirrors the monitoring Koa composition from MasterContainer: a metrics
// endpoint followed by a terminal JSON 404 handler for everything else.
const registry = new prom.Registry()
const app = new Koa()
app.use(createShowMetricsMiddleware(registry))
app.use(createNotFoundMiddleware())

let server: Server
let baseUrl: string

beforeAll(async () => {
	server = app.listen(0)
	await new Promise<void>(resolve => server.once('listening', () => resolve()))
	const { port } = server.address() as AddressInfo
	baseUrl = `http://127.0.0.1:${port}`
})

afterAll(async () => {
	await new Promise<void>(resolve => server.close(() => resolve()))
})

test('unknown url responds with consistent JSON error envelope', async () => {
	const response = await fetch(`${baseUrl}/this-route-does-not-exist`)

	expect(response.status).toBe(404)
	expect(response.headers.get('content-type')).toContain('application/json')
	expect(await response.json()).toEqual({ errors: [{ message: 'Route not found', code: 404 }] })
})

test('unknown url never returns the plain-text "Not Found" body', async () => {
	const response = await fetch(`${baseUrl}/foo/bar`)
	const text = await response.text()

	expect(text).not.toBe('Not Found')
	expect(() => JSON.parse(text)).not.toThrow()
})

test('known /metrics url still works', async () => {
	const response = await fetch(`${baseUrl}/metrics`)

	expect(response.status).toBe(200)
})
