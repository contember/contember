import { randomInt } from 'crypto'
import { anyObject, JsonObject, object, string } from '../utils/schema'
import { CollaborationStorage, ClientIdentity, Scope } from '../services/CollaborationStorage'
import { MethodDefinition, WebSocketProtocol } from '../utils/WebSocketProtocol'
import { ProjectGroupResolver } from '../services/ProjectGroupResolver'
import { readHostFromHeader } from '../utils/readHostFromHeader'
import { TenantClient } from '../services/TenantClient'
import { readAuthCookie } from '../utils/cookies'

interface Context {
	clientIdentity: ClientIdentity
	scope: Scope
	clientInformation: {
		email: string
	}
}

export class CollaborationController {
	constructor(
		private readonly storage: CollaborationStorage,
		private readonly projectGroupResolver: ProjectGroupResolver,
		private readonly tenantClient: TenantClient,
	) {}

	public protocol = new WebSocketProtocol<Context>(
		async request => {
			const token = readAuthCookie(request)
			if (!token) {
				throw new Error('No auth token')
			}

			const url = new URL(request.url ?? '', 'http://localhost')
			const clientId = url.searchParams.get('clientId') ?? randomInt(0, 1_000_000).toString()
			const project = url.pathname.substring(1)
			const projectGroup = this.projectGroupResolver.resolve(readHostFromHeader(request))

			if (!await this.tenantClient.hasProjectAccess(token, project, projectGroup)) {
				throw new Error('No access to project')
			}

			const me = await this.tenantClient.getMe(token, projectGroup)

			if (!me) {
				throw new Error('Cannot fetch identity')
			}

			return {
				clientIdentity: {
					clientId,
					identityId: me.id,
				},
				scope: {
					project,
					projectGroup,
				},
				clientInformation: {
					email: me.person.email,
				},
			}
		},
		{
			listen: new MethodDefinition(
				object({ key: string }),
				async ({ key }, { connectionData }, { createSubscription }) => {
					const subscription = createSubscription()

					const sendUpdate = async () => {
						const newData = await this.storage.get(connectionData.scope, key)
						subscription.emit({
							exclusive: newData.exclusive,
							keys: newData.keys.map(({ value, clientIdentity }) => {
								const { value: parsedValue, client } = JSON.parse(value) as JsonObject
								return {
									identityId: clientIdentity.identityId,
									value: parsedValue,
									client,
								}
							}),
						})
					}


					const stopListening = await this.storage.listen(connectionData.scope, key, async () => {
						await sendUpdate()
					})


					subscription.setOnCloseListener(async () => {
						await stopListening()
					})

					await sendUpdate()

					return { subscriptionId: subscription.id }
				},
			),
			acquireExclusive: new MethodDefinition(
				object({ key: string, value: anyObject }),
				async ({ key, value }, { connectionData }) => {
					return this.storage.acquireExclusive(connectionData.scope, connectionData.clientIdentity, key, JSON.stringify({ value, client: connectionData.clientInformation }))
				},
			),
			acquireShared: new MethodDefinition(
				object({ key: string, value: anyObject }),
				async ({ key, value }, { connectionData }) => {
					return this.storage.acquireShared(connectionData.scope, connectionData.clientIdentity, key, JSON.stringify({ value, client: connectionData.clientInformation }))
				},
			),
			updateValue: new MethodDefinition(
				object({ key: string, value: anyObject }),
				async ({ key, value }, { connectionData }) => {
					return this.storage.updateValue(connectionData.scope, connectionData.clientIdentity, key, JSON.stringify({ value, client: connectionData.clientInformation }))
				},
			),
			release: new MethodDefinition(
				object({ key: string }),
				async ({ key }, { connectionData }) => {
					return this.storage.release(connectionData.scope, connectionData.clientIdentity, key)
				},
			),
		},
		async context => {
			await this.storage.clientHeartbeat(context.connectionData.scope, context.connectionData.clientIdentity)
		},
		async context => {
			await this.storage.clientDisconnected(context.connectionData.scope, context.connectionData.clientIdentity)
		}
	)
}
