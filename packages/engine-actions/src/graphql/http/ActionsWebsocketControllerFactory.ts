import { HttpErrorResponse, ProjectGroupContainer, WebSocketController } from '@contember/engine-http'
import * as Typesafe from '@contember/typesafe'
import { TenantRole } from '@contember/engine-tenant-api'
import { Runnable, Running } from '@contember/engine-common'

const IncomingMessage = Typesafe.discriminatedUnion(
	'type',
	{
		startWorker: Typesafe.object({}),
		stopAllWorkers: Typesafe.object({}),
	},
)
type IncomingMessage = ReturnType<typeof IncomingMessage>
const OutgoingMessage = Typesafe.discriminatedUnion(
	'type',
	{
		error: Typesafe.object({
			message: Typesafe.string,
		}),
		message: Typesafe.object({
			message: Typesafe.string,
		}),
		ready: Typesafe.object({}),

		workerStarted: Typesafe.object({
			workerId: Typesafe.string,
		}),
		workedStopped: Typesafe.object({
			workerId: Typesafe.string,
		}),
		workerFailedToStart: Typesafe.object({
			workerId: Typesafe.string,
		}),
		workerCrashed: Typesafe.object({
			workerId: Typesafe.string,
		}),
	},
)

type OutgoingMessage = ReturnType<typeof OutgoingMessage>

type DispatchWorkerFactory = {
	create(projectGroup: ProjectGroupContainer): Runnable
}

export class ActionsWebsocketControllerFactory {
	constructor(
		private readonly debug: boolean,
		private readonly dispatchWorkerSupervisorFactory: DispatchWorkerFactory,
	) {
	}

	create(): WebSocketController {
		return async ctx => {
			const { ws, logger, authResult, projectGroup } = ctx
			if (!authResult) {
				throw new HttpErrorResponse(401, 'Authentication required')
			}
			if (!authResult.roles.some(it => it === TenantRole.SUPER_ADMIN || it === TenantRole.PROJECT_ADMIN)) {
				throw new HttpErrorResponse(403, 'Not allowed to run actions worker')
			}

			const send = (message: OutgoingMessage) => {
				if (this.debug) {
					OutgoingMessage(message)
				}
				ws.send(JSON.stringify(message))
			}

			let workers: { id: string; running: Promise<Running> }[] = []
			let stopAllPromise: Promise<void> | undefined
			let connectionClosing = false
			const abortListener = async () => {
				connectionClosing = true
				try {
					send({ type: 'message', message: 'shutting down' })
					await stopAll()
				} catch (error) {
					logger.error(error, { message: 'Websocket worker cleanup failed' })
				} finally {
					try {
						send({ type: 'message', message: 'closing connection' })
					} finally {
						ws.close(1012) // Service Restart
					}
				}
			}
			ctx.abortSignal.addEventListener('abort', abortListener)

			const stopAll = (): Promise<void> => {
				stopAllPromise ??= (async () => {
					// a worker stays tracked until its own end() resolves, so a failed cleanup is not forgotten
					const results = await Promise.allSettled(workers.map(async it => {
						await (await it.running).end()
						workers = workers.filter(worker => worker !== it)
						send({
							type: 'workedStopped',
							workerId: it.id,
						})
					}))
					const errors = results.flatMap(it => it.status === 'rejected' ? [it.reason] : [])
					if (errors.length > 0) {
						throw new AggregateError(errors, 'Worker cleanup failed')
					}
				})().finally(() => {
					stopAllPromise = undefined
				})
				return stopAllPromise
			}
			send({ type: 'ready' })

			ws.addEventListener('message', async message => {
				let json
				try {
					json = JSON.parse(message.data.toString())
				} catch {
					send({ type: 'error', message: 'Invalid JSON' })
					return
				}
				let data: IncomingMessage
				try {
					data = IncomingMessage(json)
				} catch (e) {
					if (e instanceof Typesafe.ParseError) {
						send({ type: 'error', message: e.message })
						return
					} else {
						throw e
					}
				}

				switch (data.type) {
					case 'startWorker':
						if (connectionClosing || stopAllPromise !== undefined) {
							send({ type: 'error', message: 'Workers are stopping' })
							break
						}
						const workerId = Math.random().toString().substring(2)
						const dispatchSupervisor = this.dispatchWorkerSupervisorFactory.create(projectGroup)
						const running = Promise.resolve().then(() =>
							dispatchSupervisor.run({
								logger,
								onError: () => {
									send({ type: 'workerCrashed', workerId })
								},
							})
						)
						const worker = { id: workerId, running }
						workers.push(worker)
						try {
							await running
						} catch (e) {
							workers = workers.filter(it => it !== worker)
							logger.error(e, { message: 'Worker failed to start' })
							send({ type: 'workerFailedToStart', workerId })
							break
						}
						send({ type: 'workerStarted', workerId })
						break
					case 'stopAllWorkers':
						send({ type: 'message', message: 'stopping' })
						try {
							await stopAll()
							send({ type: 'message', message: 'all stopped' })
						} catch (error) {
							logger.error(error, { message: 'Websocket worker cleanup failed' })
							send({ type: 'error', message: 'Worker cleanup failed' })
						}
						break
				}
			})

			const pingHandle = setInterval(() => {
				ws.ping()
			}, 5000)

			ctx.waitUntil(
				new Promise<void>(resolve => {
					ws.addEventListener('close', () => {
						connectionClosing = true
						ctx.abortSignal.removeEventListener('abort', abortListener)
						clearInterval(pingHandle)
						void stopAll().then(resolve, error => {
							logger.error(error, { message: 'Websocket worker cleanup failed' })
							resolve()
						})
					})
				}),
			)
		}
	}
}
