import { createClient as createRedisClient } from 'redis'

const VALUE_EXPIRATION_MILLISECONDS = 12_000

export interface Scope {
	projectGroup: string | undefined
	project: string
}

export interface ClientIdentity {
	clientId: string
	identityId: string
}

export type Result<R, E> = { ok: true, value: R } | { ok: false, error: E }

export interface CollaborationStorage {
	get(scope: Scope, key: string): Promise<{ exclusive: boolean, keys: Array<{ value: string, clientIdentity: ClientIdentity }> }>
	listen(scope: Scope, key: string, onNewValue: () => void): Promise<() => Promise<void>>
	acquireExclusive(scope: Scope, clientIdentity: ClientIdentity, key: string, value: string): Promise<Result<undefined, undefined>>
	acquireShared(scope: Scope, clientIdentity: ClientIdentity, key: string, value: string): Promise<Result<undefined, undefined>>
	updateValue(scope: Scope, clientIdentity: ClientIdentity, key: string, value: string): Promise<Result<undefined, undefined>>
	release(scope: Scope, clientIdentity: ClientIdentity, key: string): Promise<Result<undefined, undefined>>
	clientHeartbeat(scope: Scope, clientIdentity: ClientIdentity): Promise<void>
	clientDisconnected(scope: Scope, clientIdentity: ClientIdentity): Promise<void>
}

type RedisClient = ReturnType<typeof createRedisClient>

export class CollaborationRedisKeys {
	constructor(private readonly prefix: string) {}

	buildScopeKey(scope: Scope) {
		if (scope.projectGroup) {
			return `${scope.projectGroup}:${scope.project}`
		} else {
			return scope.project
		}
	}

	parseScopeKey(scopeKey: string): Scope {
		const [projectGroup, project] = scopeKey.split(':')
		return { projectGroup, project }
	}

	buildScopedClientId({ identityId, clientId }: ClientIdentity) {
		return `${identityId}:${clientId}`
	}

	parseScopedClientId(scopedClientId: string): ClientIdentity {
		const [identityId, clientId] = scopedClientId.split(':')
		return { identityId, clientId }
	}

	buildHeartbeatKey(scope: Scope, clientIdentity: ClientIdentity) {
		return `${this.prefix}:${this.buildScopeKey(scope)}:${this.buildScopedClientId(clientIdentity)}:heartbeat`
	}

	buildIsExclusiveKey(scope: Scope, key: string) {
		return `${this.prefix}:${this.buildScopeKey(scope)}:${key}:isExclusive`
	}

	buildValueHashKey(scope: Scope, key: string) {
		return `${this.prefix}:${this.buildScopeKey(scope)}:${key}`
	}
}

export class CollaborationRedisStorage implements CollaborationStorage {
	constructor(
		private redisClient: RedisClient,
		private keys: CollaborationRedisKeys,
	) {}

	private async repeatableWithIsolation<T>(cb: (isolatedClient: RedisClient) => Promise<T>): Promise<T> {
		let retries = 0
		while (true) {
			try {
				return await this.redisClient.executeIsolated(async isolatedClient => {
					return await cb(isolatedClient)
				})
			} catch (e) {
				if (retries++ >= 3) {
					throw e
				}
			}
		}
	}

	async get(scope: Scope, key: string): Promise<{ exclusive: boolean, keys: Array<{ value: string, clientIdentity: ClientIdentity }> }> {
		return await this.repeatableWithIsolation(async isolatedClient => {
			isolatedClient.watch(this.keys.buildValueHashKey(scope, key))
			isolatedClient.watch(this.keys.buildIsExclusiveKey(scope, key))

			const keys = []
			for await (const { field: scopedClientId, value } of isolatedClient.hScanIterator(this.keys.buildValueHashKey(scope, key))) {
				keys.push({
					clientIdentity: this.keys.parseScopedClientId(scopedClientId),
					value,
				})
			}
			const exclusive = await isolatedClient.get(this.keys.buildIsExclusiveKey(scope, key)) === 'true'
			await isolatedClient.unwatch()

			return {
				exclusive,
				keys,
			}
		})
	}

	async listen(scope: Scope, key: string, onNewValue: () => void): Promise<() => Promise<void>> {
		const isolatedClient = this.redisClient.duplicate({ isolationPoolOptions: undefined })
		await isolatedClient.connect()

		isolatedClient.subscribe(this.keys.buildValueHashKey(scope, key), (channel, message) => {
			onNewValue()
		})

		const handle = setInterval(
			async () => {
				await this.cleanKey(scope, key)
			},
			VALUE_EXPIRATION_MILLISECONDS / 2,
		)

		return async () => {
			clearInterval(handle)
			await isolatedClient.unsubscribe(this.keys.buildValueHashKey(scope, key))
			await isolatedClient.disconnect()
		}
	}

	private async cleanKey(scope: Scope, key: string): Promise<void> {
		await this.repeatableWithIsolation(async isolatedClient => {
			await isolatedClient.watch(this.keys.buildIsExclusiveKey(scope, key))
			const valueHashKey = this.keys.buildValueHashKey(scope, key)
			const keys = await isolatedClient.hKeys(valueHashKey)
			const now = Date.now()
			let multi = isolatedClient.multi()

			let disconnectedClients = 0
			for (const scopedClientId of keys) {
				const heartbeatKey = this.keys.buildHeartbeatKey(scope, this.keys.parseScopedClientId(scopedClientId))
				await isolatedClient.watch(heartbeatKey)
				const lastHeartbeat = await isolatedClient.get(heartbeatKey)
				if (lastHeartbeat === null || now - Number(lastHeartbeat) > VALUE_EXPIRATION_MILLISECONDS) {
					multi = multi.hDel(valueHashKey, scopedClientId)
					disconnectedClients++
				}
			}

			if (disconnectedClients === keys.length) {
				multi = multi.del(this.keys.buildIsExclusiveKey(scope, key))
			}

			await multi.exec()

			if (disconnectedClients > 0) {
				await isolatedClient.publish(valueHashKey, 'cleaned')
			}
		})
	}

	async acquireExclusive(scope: Scope, clientIdentity: ClientIdentity, key: string, value: string): Promise<Result<undefined, undefined>> {
		await this.cleanKey(scope, key)
		return await this.repeatableWithIsolation(async isolatedClient => {
			const valueHashSetKey = this.keys.buildValueHashKey(scope, key)
			await isolatedClient.watch(valueHashSetKey)
			const isEmpty = await isolatedClient.hLen(valueHashSetKey) === 0

			if (isEmpty) {
				// TODO: Handle retry on CAS failure
				await isolatedClient.multi()
					.hSet(valueHashSetKey, this.keys.buildScopedClientId(clientIdentity), value)
					.set(this.keys.buildIsExclusiveKey(scope, key), 'true')
					.exec()
				await isolatedClient.publish(valueHashSetKey, 'acquire-exclusive')
				return { ok: true, value: undefined }
			} else {
				await isolatedClient.unwatch()
				return { ok: false, error: undefined }
			}
		})
	}

	async acquireShared(scope: Scope, clientIdentity: ClientIdentity, key: string, value: string): Promise<Result<undefined, undefined>> {
		await this.cleanKey(scope, key)
		return await this.repeatableWithIsolation(async isolatedClient => {
			const valueHashSetKey = this.keys.buildValueHashKey(scope, key)
			const isExclusiveKey = this.keys.buildIsExclusiveKey(scope, key)
			await isolatedClient.watch(isExclusiveKey)
			const isExclusive = await isolatedClient.get(isExclusiveKey)
			if (isExclusive === null || isExclusive === 'false') {
				let multi = isolatedClient
					.multi()
					.hSet(valueHashSetKey, this.keys.buildScopedClientId(clientIdentity), value)

				if (isExclusive === null) {
					multi = multi.set(isExclusiveKey, 'false')
				}

				// TODO: Handle retry on CAS failure
				await multi.exec()
				await isolatedClient.publish(valueHashSetKey, 'acquire-shared')
				return { ok: true, value: undefined }
			} else {
				await isolatedClient.unwatch()
				return { ok: false, error: undefined }
			}
		})
	}

	async updateValue(scope: Scope, clientIdentity: ClientIdentity, key: string, value: string): Promise<Result<undefined, undefined>> {
		return await this.repeatableWithIsolation(async isolatedClient => {
			const valueHashSetKey = this.keys.buildValueHashKey(scope, key)
			const scopedClientId = this.keys.buildScopedClientId(clientIdentity)
			await isolatedClient.watch(valueHashSetKey)
			if (isolatedClient.hGet(valueHashSetKey, scopedClientId) !== null) {
				// TODO: Handle retry on CAS failure
				await isolatedClient.multi().hSet(valueHashSetKey, scopedClientId, value).exec()
				await isolatedClient.publish(valueHashSetKey, 'update-value')
				return { ok: true, value: undefined }
			} else {
				await isolatedClient.unwatch()
				return { ok: false, error: undefined }
			}
		})
	}

	async release(scope: Scope, clientIdentity: ClientIdentity, key: string): Promise<Result<undefined, undefined>> {
		return await this.repeatableWithIsolation(async isolatedClient => {
			const valueHashSetKey = this.keys.buildValueHashKey(scope, key)
			const deletedCount = await isolatedClient.hDel(valueHashSetKey, this.keys.buildScopedClientId(clientIdentity))
			if (deletedCount === 1) {
				await isolatedClient.publish(valueHashSetKey, 'released')
				return { ok: true, value: undefined }
			} else {
				return { ok: false, error: undefined }
			}
		})
	}

	async clientHeartbeat(scope: Scope, clientIdentity: ClientIdentity): Promise<void> {
		return await this.repeatableWithIsolation(async isolatedClient => {
			await isolatedClient.set(this.keys.buildHeartbeatKey(scope, clientIdentity), Date.now().toString())
		})
	}

	async clientDisconnected(scope: Scope, clientIdentity: ClientIdentity): Promise<void> {
		return await this.repeatableWithIsolation(async isolatedClient => {
			await isolatedClient.del(this.keys.buildHeartbeatKey(scope, clientIdentity))
		})
	}
}
