import { expect, test } from 'bun:test'
import { VerifyResult } from '@contember/engine-tenant-api'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { Readable } from 'node:stream'
import { WebSocket } from 'ws'
import { Application } from '../../../src/application/application.js'
import { Authenticator } from '../../../src/common/Authorizator.js'
import { serverConfigSchema } from '../../../src/config/configSchema.js'
import { ProjectGroupContainer } from '../../../src/projectGroup/ProjectGroupContainer.js'
import { ProjectGroupResolver } from '../../../src/projectGroup/ProjectGroupResolver.js'
import { createMock } from '../../utils.js'

const unavailable = (): never => {
	throw new Error('This service is not available in the application shutdown test')
}

const createTestApplication = (
	authenticate: Authenticator['authenticate'] = async () => new VerifyResult('identity', 'api-key', ['member'], null),
) => {
	const logger = createLogger(new TestLoggerHandler())
	const authenticator = createMock<Authenticator>({ authenticate })
	const projectGroup: ProjectGroupContainer = {
		slug: undefined,
		logger,
		authenticator,
		get projectMembershipResolver() {
			return unavailable()
		},
		get projectContainerResolver() {
			return unavailable()
		},
		get projectSchemaResolver() {
			return unavailable()
		},
		get projectInitializer() {
			return unavailable()
		},
		get tenantContainer() {
			return unavailable()
		},
		get tenantGraphQLHandler() {
			return unavailable()
		},
		get systemContainer() {
			return unavailable()
		},
		get systemGraphQLHandler() {
			return unavailable()
		},
	}
	const projectGroupResolver = createMock<ProjectGroupResolver>({
		resolveContainer: async () => projectGroup,
	})
	return new Application(projectGroupResolver, serverConfigSchema({ port: 0 }), false, undefined, logger)
}

test('waits for an active HTTP stream when shutting down after a WebSocket upgrade', async () => {
	const application = createTestApplication()
	let releaseStream = () => {}
	const streamReleased = new Promise<void>(resolve => {
		releaseStream = resolve
	})
	application.addRoute('transfer', '/stream', context => {
		context.koa.status = 200
		context.koa.body = Readable.from((async function*() {
			yield 'first'
			await streamReleased
			yield 'second'
		})())
	})
	let resolveWebsocketCleanup = () => {}
	const websocketCleanup = new Promise<void>(resolve => {
		resolveWebsocketCleanup = resolve
	})
	application.addWebsocketRoute('actions', '/actions', ({ ws, abortSignal }) => {
		abortSignal.addEventListener('abort', () => ws.close(1012), { once: true })
		ws.once('close', resolveWebsocketCleanup)
	})
	const running = await application.listen()
	const address = running.server.address()
	if (address === null || typeof address === 'string') {
		await running.close()
		throw new Error('The test server did not bind to a TCP port')
	}
	const client = new WebSocket(`ws://127.0.0.1:${address.port}/actions`)
	const opened = new Promise<void>((resolve, reject) => {
		client.once('open', () => resolve())
		client.once('error', reject)
	})
	const clientClosed = new Promise<number>(resolve => client.once('close', code => resolve(code)))
	let shutdown: Promise<void> | undefined
	try {
		await opened
		const response = await fetch(`http://127.0.0.1:${address.port}/stream`)
		const responseBody = response.text()
		let shutdownFinished = false
		shutdown = running.close().then(() => {
			shutdownFinished = true
		})
		await websocketCleanup
		await new Promise<void>(resolve => setImmediate(resolve))
		expect(shutdownFinished).toBe(false)
		releaseStream()
		expect(await responseBody).toBe('firstsecond')
		await shutdown
		expect(await clientClosed).toBe(1012)
	} finally {
		releaseStream()
		shutdown ??= running.close()
		await shutdown
		client.terminate()
	}
})

test('rejects a WebSocket upgrade whose authentication finishes during shutdown', async () => {
	let releaseAuthentication = () => {}
	const authenticationReleased = new Promise<void>(resolve => {
		releaseAuthentication = resolve
	})
	let authenticationStarted = () => {}
	const started = new Promise<void>(resolve => {
		authenticationStarted = resolve
	})
	const application = createTestApplication(async () => {
		authenticationStarted()
		await authenticationReleased
		return new VerifyResult('identity', 'api-key', ['member'], null)
	})
	let controllerCalled = false
	application.addWebsocketRoute('actions', '/actions', () => {
		controllerCalled = true
	})
	const running = await application.listen()
	const address = running.server.address()
	if (address === null || typeof address === 'string') {
		await running.close()
		throw new Error('The test server did not bind to a TCP port')
	}
	const client = new WebSocket(`ws://127.0.0.1:${address.port}/actions`)
	client.on('error', () => {})
	const clientClosed = new Promise<void>(resolve => client.once('close', () => resolve()))

	await started
	const shutdown = running.close()
	releaseAuthentication()
	await shutdown
	await clientClosed
	expect(controllerCalled).toBe(false)
})
