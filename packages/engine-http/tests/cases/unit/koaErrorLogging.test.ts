import { afterAll, afterEach, beforeAll, expect, spyOn, test } from 'bun:test'
import { createLogger, LogEntry, TestLoggerHandler } from '@contember/logger'
import { get } from 'node:http'
import { connect } from 'node:net'
import { Application, RunningApplication } from '../../../src/application/application.js'
import { serverConfigSchema } from '../../../src/config/configSchema.js'
import { ProjectGroupResolver } from '../../../src/projectGroup/ProjectGroupResolver.js'
import { createMock } from '../../utils.js'

const logs = new TestLoggerHandler()
const consoleError = spyOn(console, 'error').mockImplementation(() => {})
let running: RunningApplication
let port: number

beforeAll(async () => {
	const projectGroupResolver = createMock<ProjectGroupResolver>({
		resolveContainer: () => Promise.reject(new Error('No project group in this test')),
	})
	const application = new Application(projectGroupResolver, serverConfigSchema({ port: 0 }), false, undefined, createLogger(logs))
	application.addMiddleware(async (ctx, next) => {
		if (ctx.path === '/failing-middleware') {
			throw new Error('middleware failed')
		}
		if (ctx.path === '/upstream-reset') {
			throw Object.assign(new Error('upstream connection reset'), { code: 'ECONNRESET' })
		}
		await next()
	})
	running = await application.listen()
	const address = running.server.address()
	if (address === null || typeof address === 'string') {
		throw new Error('The test server did not bind to a TCP port')
	}
	port = address.port
})

afterAll(async () => {
	await running.close()
	consoleError.mockRestore()
})

afterEach(() => {
	logs.messages.length = 0
	consoleError.mockClear()
})

const waitFor = async (condition: () => boolean): Promise<void> => {
	const deadline = Date.now() + 2000
	while (!condition() && Date.now() < deadline) {
		await new Promise(resolve => setTimeout(resolve, 10))
	}
}

test('a client that drops the connection mid-upload is logged at debug level, without a stack on stderr', async () => {
	const socket = connect(port, '127.0.0.1')
	const headers = ['POST /upload HTTP/1.1', 'Host: localhost', 'Content-Type: application/json', 'Content-Length: 800']
	socket.write([...headers, '', '{"a":'].join('\r\n'))
	await new Promise(resolve => setTimeout(resolve, 50))
	socket.destroy()

	const isParseError = (entry: LogEntry) => entry.ownAttributes.code === 'HPE_INVALID_EOF_STATE'
	await waitFor(() => consoleError.mock.calls.length > 0 || logs.messages.some(isParseError))
	expect(consoleError).not.toHaveBeenCalled()
	expect(logs.messages.filter(isParseError).map(it => [it.level.name, it.error, it.ownAttributes])).toEqual([
		['debug', undefined, { method: 'POST', uri: '/upload', code: 'HPE_INVALID_EOF_STATE' }],
	])
	expect(logs.messages.filter(it => it.level.name !== 'debug')).toEqual([])
})

const requestStatus = (path: string): Promise<number | undefined> =>
	new Promise((resolve, reject) => {
		get(`http://127.0.0.1:${port}${path}`, response => {
			response.resume()
			resolve(response.statusCode)
		}).on('error', reject)
	})

const loggedErrors = async (): Promise<unknown[]> => {
	await waitFor(() => consoleError.mock.calls.length > 0 || logs.messages.some(it => it.level.name === 'error'))
	expect(consoleError).not.toHaveBeenCalled()
	return logs.messages.filter(it => it.level.name === 'error').map(it => it.error instanceof Error ? it.error.message : it.error)
}

test('any other error that reaches Koa is still logged as an error', async () => {
	expect(await requestStatus('/failing-middleware?token=secret')).toBe(500)
	expect(await loggedErrors()).toEqual(['middleware failed'])
	expect(logs.messages.find(it => it.level.name === 'error')?.ownAttributes).toEqual({ method: 'GET', uri: '/failing-middleware?[redacted]' })
})

test('a connection error of an outgoing call is still logged as an error while the client stays connected', async () => {
	expect(await requestStatus('/upstream-reset')).toBe(500)
	expect(await loggedErrors()).toEqual(['upstream connection reset'])
})
