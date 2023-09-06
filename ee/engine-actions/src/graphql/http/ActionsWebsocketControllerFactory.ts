import { HttpErrorResponse, WebSocketController } from '@contember/engine-http'
import { ActionsContextResolver } from './ActionsContextResolver'
import { DispatchWorkerSupervisorFactory } from '../../dispatch/DispatchWorkerSupervisor'
import * as Typesafe from '@contember/typesafe'
import { TenantRole } from '@contember/engine-tenant-api'
import { Running } from '@contember/engine-common'

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

export class ActionsWebsocketControllerFactory {
	constructor(
		private readonly debug: boolean,
		private readonly actionsContextResolver: ActionsContextResolver,
		private readonly dispatchWorkerSupervisorFactory: DispatchWorkerSupervisorFactory,
	) {
	}

	create(): WebSocketController {
		return async ctx => {
			const { ws, logger, authResult, projectGroup } = ctx
			if (!authResult) {
				throw new HttpErrorResponse(401, 'Authentication required')
			}
			if (!authResult.roles.some(it => it === TenantRole.SUPER_ADMIN || it  === TenantRole.PROJECT_ADMIN)) {
				throw new HttpErrorResponse(403, 'Not allowed to run actions worker')
			}

			const send = (message: OutgoingMessage) => {
				if (this.debug) {
					OutgoingMessage(message)
				}
				ws.send(JSON.stringify(message))
			}

			let workers: { id: string; running: Promise<Running> }[] = []
			const abortListener = async () => {
				send({ type: 'message', message: 'shutting down' })
				await stopAll()
				send({ type: 'message', message: 'closing connection' })
				ws.close(1012) // Service Restart
			}
			ctx.abortSignal.addEventListener('abort', abortListener)

			const stopAll = async () => {
				const currentWorkers = workers.map(async it => {
					await (await it.running).end()
					send({
						type: 'workedStopped',
						workerId: it.id,
					})
				})
				workers = []
				await Promise.all(currentWorkers)
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
						const workerId = Math.random().toString().substring(2)
						const dispatchSupervisor = this.dispatchWorkerSupervisorFactory.create(projectGroup)
						try {
							const running  = dispatchSupervisor.run({ logger, onError: () => {
								send({ type: 'workerCrashed', workerId })
							} })
							workers.push({ id: workerId, running })
							await running
							send({ type: 'workerStarted', workerId })
						} catch (e) {
							logger.error(e, { message: 'Worker failed to start' })
							send({ type: 'workerFailedToStart', workerId })
						}
						break
					case 'stopAllWorkers':
						send({ type: 'message', message: 'stopping' })
						await stopAll()
						send({ type: 'message', message: 'all stopped' })
						break
				}
			})

			const pingHandle = setInterval(() => {
				ws.ping()
			}, 5000)

			ws.addEventListener('close', async () => {
				ctx.abortSignal.removeEventListener('abort', abortListener)
				clearInterval(pingHandle)
				await stopAll()
			})
		}
	}
}

