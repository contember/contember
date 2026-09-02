import { expect, test } from 'bun:test'
import { Runnable, Running } from '@contember/engine-common'
import { Application, Authenticator, ProjectGroupContainer, ProjectGroupResolver, serverConfigSchema } from '@contember/engine-http'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { TenantRole, VerifyResult } from '@contember/engine-tenant-api'
import { WebSocket } from 'ws'
import { ActionsWebsocketControllerFactory } from '../../../src/graphql/http/ActionsWebsocketControllerFactory.js'

type Interface<T> = { [P in keyof T]: T[P] }

const createMock = <T>(members: Interface<T>): T => members

const unavailable = (): never => {
	throw new Error('This service is not available in the actions WebSocket controller test')
}

const waitFor = async (condition: () => boolean): Promise<void> => {
	for (let attempt = 0; attempt < 100; attempt++) {
		if (condition()) {
			return
		}
		await new Promise<void>(resolve => setTimeout(resolve, 1))
	}
	throw new Error('Condition was not met')
}

const listen = async (createWorker: () => Runnable) => {
	const loggerHandler = new TestLoggerHandler()
	const logger = createLogger(loggerHandler)
	const authenticator = createMock<Authenticator>({
		authenticate: async () => new VerifyResult('identity', 'api-key', [TenantRole.SUPER_ADMIN], null),
	})
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
	const application = new Application(projectGroupResolver, serverConfigSchema({ port: 0 }), false, undefined, logger)
	application.addWebsocketRoute(
		'actions',
		'/actions/_worker',
		new ActionsWebsocketControllerFactory(false, { create: createWorker }).create(),
	)
	const running = await application.listen()
	const address = running.server.address()
	if (address === null || typeof address === 'string') {
		await running.close()
		throw new Error('The test server did not bind to a TCP port')
	}

	const messages: string[] = []
	const client = new WebSocket(`ws://127.0.0.1:${address.port}/actions/_worker`)
	client.on('message', data => {
		const message: unknown = JSON.parse(data.toString())
		if (typeof message === 'object' && message !== null && 'type' in message && typeof message.type === 'string') {
			const detail = 'message' in message && typeof message.message === 'string' ? `:${message.message}` : ''
			messages.push(`${message.type}${detail}`)
		}
	})
	const opened = new Promise<void>((resolve, reject) => {
		client.once('open', () => resolve())
		client.once('error', reject)
	})
	const closed = new Promise<number>(resolve => client.once('close', code => resolve(code)))
	return { client, closed, loggerHandler, messages, opened, running }
}

test('a worker startup failure does not block WebSocket shutdown', async () => {
	const worker: Runnable = {
		run: (): Promise<Running> => Promise.reject(new Error('Worker startup failed')),
	}
	const { client, closed, loggerHandler, messages, opened, running } = await listen(() => worker)
	let applicationClosed = false

	try {
		await opened
		await waitFor(() => messages.includes('ready'))
		client.send(JSON.stringify({ type: 'startWorker' }))
		await waitFor(() => messages.includes('workerFailedToStart'))

		await running.close()
		applicationClosed = true
		expect(await closed).toBe(1012)
		expect(loggerHandler.messages.some(it => it.message.startsWith('Websocket worker cleanup failed'))).toBe(false)
	} finally {
		client.terminate()
		if (!applicationClosed) {
			await running.close()
		}
	}
})

test('shutdown waits for every worker cleanup after one cleanup fails', async () => {
	let releaseCleanup = () => {}
	const cleanupReleased = new Promise<void>(resolve => {
		releaseCleanup = resolve
	})
	let cleanupStarted = false
	const workers: Runnable[] = [
		{
			run: async () => ({
				end: (): Promise<void> => Promise.reject(new Error('Worker cleanup failed')),
			}),
		},
		{
			run: async () => ({
				end: async () => {
					cleanupStarted = true
					await cleanupReleased
				},
			}),
		},
	]
	const { client, closed, loggerHandler, messages, opened, running } = await listen(() => workers.shift() ?? unavailable())
	let shutdown: Promise<void> | undefined

	try {
		await opened
		await waitFor(() => messages.includes('ready'))
		client.send(JSON.stringify({ type: 'startWorker' }))
		await waitFor(() => messages.filter(it => it === 'workerStarted').length === 1)
		client.send(JSON.stringify({ type: 'startWorker' }))
		await waitFor(() => messages.filter(it => it === 'workerStarted').length === 2)

		let shutdownFinished = false
		shutdown = running.close().then(() => {
			shutdownFinished = true
		})
		await waitFor(() => cleanupStarted)
		await new Promise<void>(resolve => setImmediate(resolve))
		expect(shutdownFinished).toBe(false)
		expect(messages).not.toContain('message:closing connection')
		releaseCleanup()
		await shutdown
		expect(await closed).toBe(1012)
		expect(loggerHandler.messages.some(it => it.message.startsWith('Websocket worker cleanup failed'))).toBe(true)
	} finally {
		releaseCleanup()
		shutdown ??= running.close()
		await shutdown
		client.terminate()
	}
})

test('shutdown waits for worker cleanup started by a peer disconnect', async () => {
	let releaseCleanup = () => {}
	const cleanupReleased = new Promise<void>(resolve => {
		releaseCleanup = resolve
	})
	let cleanupStarted = false
	const worker: Runnable = {
		run: async () => ({
			end: async () => {
				cleanupStarted = true
				await cleanupReleased
			},
		}),
	}
	const { client, messages, opened, running } = await listen(() => worker)
	let shutdown: Promise<void> | undefined

	try {
		await opened
		await waitFor(() => messages.includes('ready'))
		client.send(JSON.stringify({ type: 'startWorker' }))
		await waitFor(() => messages.includes('workerStarted'))
		client.close()
		await waitFor(() => cleanupStarted)

		let shutdownFinished = false
		shutdown = running.close().then(() => {
			shutdownFinished = true
		})
		await new Promise<void>(resolve => setImmediate(resolve))
		expect(shutdownFinished).toBe(false)
		releaseCleanup()
		await shutdown
	} finally {
		releaseCleanup()
		shutdown ??= running.close()
		await shutdown
		client.terminate()
	}
})

test('reports a manual worker cleanup failure without blocking shutdown', async () => {
	const worker: Runnable = {
		run: async () => ({
			end: (): Promise<void> => Promise.reject(new Error('Worker cleanup failed')),
		}),
	}
	const { client, closed, messages, opened, running } = await listen(() => worker)
	let applicationClosed = false

	try {
		await opened
		await waitFor(() => messages.includes('ready'))
		client.send(JSON.stringify({ type: 'startWorker' }))
		await waitFor(() => messages.includes('workerStarted'))
		client.send(JSON.stringify({ type: 'stopAllWorkers' }))
		await waitFor(() => messages.includes('error:Worker cleanup failed'))

		await running.close()
		applicationClosed = true
		expect(await closed).toBe(1012)
	} finally {
		client.terminate()
		if (!applicationClosed) {
			await running.close()
		}
	}
})
