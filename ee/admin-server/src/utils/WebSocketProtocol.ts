import { WebSocket, WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { intersection, JsonObject, literal, object, ParseError, string, Type, union } from './schema'

interface ProtocolDefinition<C extends Context<unknown>> {
	readonly [method: string]: MethodDefinition<any, C>
}

export interface Context<CD> {
	readonly connectionData: CD
	readonly subscriptionsClose: Map<string, () => void>
}

interface Subscription {
	id: string
	emit(data: JsonObject): Promise<void>
	setOnCloseListener(cb: () => void): void
}

export class MethodDefinition<T extends JsonObject, C extends Context<unknown>> {
	constructor(
		public readonly requestSchema: Type<T>,
		public readonly handle: (request: T, context: C, _: { createSubscription: () => Subscription }) => Promise<unknown>,
	) {
	}
}

export class WebSocketProtocol<CD> {
	private webSocketServer = new WebSocketServer({ noServer: true })

	constructor(
		extractConnectionData: (request: IncomingMessage) => Promise<CD>,
		protocolDefinition: ProtocolDefinition<Context<CD>>,
		onPong: (context: Context<CD>) => Promise<void>,
		onClose?: (context: Context<CD>) => Promise<void>,
	) {
		const requestValidator = intersection(
			object({
				requestId: string,
			}),
			union(
				object({
					method: literal('unsubscribe'),
					subscriptionId: string,
				}),
				...Object.entries(protocolDefinition).map(([method, definition]) => intersection(
					object({
						method: literal(method),
					}),
					definition.requestSchema,
				)),
			),
		)


		this.webSocketServer.on('connection', (socket: WebSocket, request: IncomingMessage) => {
			const context = (async (): Promise<Context<CD>> => {
				let connectionData: CD
				try {
					connectionData = await extractConnectionData(request)
				} catch (e) {
					console.log('WebSocket protocol: Error extracting connection data', e)
					socket.close(1000, 'Refusing WebSocket connection')
					return new Promise(() => {})
				}

				return {
					connectionData,
					subscriptionsClose: new Map(),
				}
			})()

			let lastSubscriptionId = 0
			const createSubscription = (): Subscription => {
				const id = (lastSubscriptionId++).toString()
				context.then(context => {
					context.subscriptionsClose.set(id, () => {})
				})
				return {
					id,
					emit: async (data: JsonObject) => {
						if (!(await context).subscriptionsClose.has(id)) {
							console.error(`WebSocket protocol: Subscription ${id} is closed`)
							return
						}
						socket.send(JSON.stringify({
							type: 'subscription',
							subscriptionId: id,
							data,
						}))
					},
					setOnCloseListener: async listener => {
						(await context).subscriptionsClose.set(id, listener)
					},
				}
			}

			socket.addEventListener('message', async message => {
				const ctx = await context
				let requestId: string | undefined

				try {
					const {
						requestId: _reqId,
						method,
						...request
					} = requestValidator(JSON.parse(message.data.toString()))
					requestId = _reqId

					if (method === 'unsubscribe') {
						ctx.subscriptionsClose.get(request.subscriptionId)?.()
						ctx.subscriptionsClose.delete(request.subscriptionId)
						socket.send(JSON.stringify({
							type: 'response',
							requestId,
							success: true,
							response: {},
						}))

					} else {
						const response = await protocolDefinition[method].handle(request, ctx, { createSubscription })
						socket.send(JSON.stringify({
							type: 'response',
							requestId,
							success: true,
							response,
						}))
					}

				} catch (e) {
					if (!(e instanceof ParseError)) {
						console.error('WebSocket protocol: Error handling request', e)
					}

					socket.send(JSON.stringify({
						type: 'response',
						requestId: requestId,
						success: false,
						error: e instanceof ParseError ? `Invalid request: ${e.message}` : `Internal server error`,
					}))
				}
			})

			socket.on('pong', async () => {
				onPong(await context)
			})

			const pingSenderHandle = setInterval(() => {
				socket.ping()
			}, 5000)

			socket.addEventListener('close', async () => {
				clearInterval(pingSenderHandle)
				const ctx = await context
				for (const [id, listener] of ctx.subscriptionsClose) {
					listener()
				}
				ctx.subscriptionsClose.clear()
				onClose?.(ctx)
			})

			context.then(ctx => {
				onPong(ctx)
			})
		})
	}

	handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer) {
		this.webSocketServer.handleUpgrade(request, socket, head, ws => {
			this.webSocketServer.emit('connection', ws, request)
		})
	}
}
