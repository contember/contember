import { ImplementationException } from '../exceptions'
import { Client as PgClient } from 'pg'
import { ClientErrorCodes } from './errorCodes'
import EventEmitter from 'events'
import { ClientError, DatabaseError } from './errors'
import { PgClientFactory } from '../utils'

export type PoolLogger = (message: string, status: PoolStatus) => void

export type PoolConfig = Partial<PoolConfigInternal>

interface PoolConfigInternal {
	/** maximum number of connections in a pool */
	maxConnections: number
	/** maximum number of connections concurrently establishing*/
	maxConnecting: number
	/** maximum number of idle connections. when reached, will be disposed immediately */
	maxIdle: number
	/** interval between retries of recoverable errors */
	reconnectIntervalMs: number
	/** timeout to dispose idle connections */
	idleTimeoutMs: number
	/** timeout of pending item waiting for a connection. also used for retries of recoverable errors */
	acquireTimeoutMs: number
	/** how many times can a single connection be acquired */
	maxUses?: number
	/** max age of connection. when reached, connection will be disposed after returning to a pool  */
	maxAgeMs?: number
	/** internal logging, mainly for debugging and testing */
	log?: PoolLogger
}

export interface PoolStatus {
	/** maximum number of connections in a pool */
	max: number
	/** number of items waiting for a connections */
	pending: number
	/** number of active (acquired) connections */
	active: number
	/** number of available idle connections */
	idle: number
	/** number of currently establishing connections */
	connecting: number
}

class PoolConnection {
	public disposed = false
	public uses = 0
	public createdAt = Date.now()
	public timerId: NodeJS.Timeout | undefined

	constructor(
		public readonly client: PgClient,
	) {
	}
}

class PendingItem {
	public readonly createdAt = Date.now()

	constructor(
		public resolve: (connection: PoolConnection) => void,
		public reject: (error: Error) => void,
	) {
	}
}

interface Pool {
	on(event: 'error', listener: (err: Error) => void): this

	on(event: 'recoverableError', listener: (err: Error) => void): this
}

class Pool extends EventEmitter {

	/**
	 * pool was closed by calling end().
	 * All connection was disposed and it is not possible to acquire new one
	 */
	private ended = false

	/**
	 * current count of connection attempts
	 * also includes timeout between recoverable retries
	 */
	private connectingCount = 0

	/**
	 * available idle connections
	 */
	private idle: PoolConnection[] = []

	/**
	 * currently acquired connections
	 */
	private active = new Set<PoolConnection>()

	/**
	 * items waiting for released or newly established connection
	 */
	private queue: PendingItem[] = []

	private poolConfig: PoolConfigInternal

	private lastRecoverableError: {
		error: any
		time: number
	} | undefined

	constructor(
		private clientFactory: PgClientFactory,
		poolConfig: PoolConfig,
	) {
		super()
		this.poolConfig = {
			maxConnections: 10,
			maxConnecting: Math.ceil((poolConfig.maxConnections ?? 10) / 2),
			maxIdle: Math.ceil((poolConfig.maxConnections ?? 10) / 2),
			idleTimeoutMs: 10_000,
			acquireTimeoutMs: 10_000,
			reconnectIntervalMs: 100,
			...poolConfig,
		}
	}

	public acquire(): Promise<PoolConnection> {
		if (this.ended) {
			throw new PoolClosedError()
		}
		const poolConnection = this.idle.pop()
		if (poolConnection !== undefined) {
			if (poolConnection.timerId) {
				clearTimeout(poolConnection.timerId)
			}
			poolConnection.uses++
			this.active.add(poolConnection)
			this.log('Item fulfilled with an idle connection.')

			return Promise.resolve(poolConnection)
		}
		const pendingItem = this.createPendingItem()
		this.log('Item added to a queue.')
		this.maybeCreateNew()
		return pendingItem
	}


	public release(poolConnection: PoolConnection): void {
		if (this.ended) {
			return
		}
		this.log('Releasing a connection.')
		if (!this.active.delete(poolConnection)) {
			throw new ImplementationException('Connection does not belong to this pool.')
		}
		if (
			(this.poolConfig.maxUses && poolConnection.uses >= this.poolConfig.maxUses)
			|| (this.poolConfig.maxAgeMs && poolConnection.createdAt + this.poolConfig.maxAgeMs < Date.now())) {
			setImmediate(async () => {
				await this.disposeConnection(poolConnection)
				this.log('Connection has reached max age or usage and was disposed.')
			})
			this.maybeCreateNew()
			return
		}
		this.handleAvailableConnection(poolConnection)
	}


	public dispose(poolConnection: PoolConnection): void {
		if (this.ended) {
			return
		}
		this.log('Releasing and disposing a connection.')
		if (!this.active.delete(poolConnection)) {
			throw new ImplementationException('Connection does not belong to this pool.')
		}
		setImmediate(async () => {
			await this.disposeConnection(poolConnection)
			this.log('Connection errored and was disposed.')
		})
		this.maybeCreateNew()
	}


	public async end(): Promise<void> {
		this.ended = true
		this.queue.forEach(it => it.reject(new PoolClosedError()))
		this.queue = []
		const allConnections = [...this.idle, ...Array.from(this.active)]
		await Promise.allSettled(allConnections.map(it => this.disposeConnection(it)))
		this.idle = []
		this.active.clear()
	}


	public getPoolStatus(): PoolStatus {
		return {
			max: this.poolConfig.maxConnections,
			active: this.active.size,
			idle: this.idle.length,
			pending: this.queue.length,
			connecting: this.connectingCount,
		}
	}


	private async maybeCreateNew(attempt = 1): Promise<void> {
		if (this.ended) {
			return
		}
		if (this.queue.length === 0) {
			this.log('Not connecting, queue is empty.')
			return
		}
		const connectingCount = this.connectingCount
		if (connectingCount >= this.queue.length) {
			this.log('Not connecting, already establishing connection for all queued items.')
			return
		}
		const idleCount = this.idle.length
		if ((this.active.size + idleCount + connectingCount) >= this.poolConfig.maxConnections) {
			this.log('Not connecting, max connections reached.')
			return
		}
		if (connectingCount >= this.poolConfig.maxConnecting) {
			this.log('Not connecting, maximum concurrent connection attempts in progress.')
			return
		}
		this.log('Creating a new connection')
		const client = this.clientFactory()
		this.connectingCount++
		const poolConnection = new PoolConnection(client)
		client.on('error', e => {
			this.log('Client error on idle connection has occurred: ' + e.message)
			this.emit('error', e)
		})
		try {
			await client.connect()
			this.log('Connection established')
			this.connectingCount--
			if (this.ended) {
				await this.disposeConnection(poolConnection)
				return
			}
		} catch (e: any) {
			this.log('Connection error occurred: ' + e.message)
			try {
				await client.end()
			} catch {
			}
			if (e.code === ClientErrorCodes.TOO_MANY_CONNECTIONS || e.code === ClientErrorCodes.CANNOT_CONNECT_NOW) {
				this.lastRecoverableError = { error: e, time: Date.now() }
				if (this.poolConfig.reconnectIntervalMs * attempt >= this.poolConfig.acquireTimeoutMs) {
					this.log('Recoverable error, max retries reached.')
					this.emit('e', e)
					this.connectingCount--
				} else {
					this.log('Recoverable error, retrying in a moment.')
					this.emit('recoverableError', e)
					setTimeout(() => {
						this.connectingCount--
						this.log('Retrying')
						this.maybeCreateNew(attempt + 1)
					}, this.poolConfig.reconnectIntervalMs)
				}
			} else {
				this.connectingCount--
				const pendingItem = this.queue.shift()
				if (pendingItem) {
					this.log('Connecting failed, rejecting pending item')
					pendingItem.reject(new ClientError(e))
				} else {
					this.log('Connecting failed, emitting error')
					this.emit('error', e)
				}
			}
			return
		}
		this.handleAvailableConnection(poolConnection)
		this.maybeCreateNew()
	}

	private createPendingItem(): Promise<PoolConnection> {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				const acquireTimeoutError = new AcquireTimeoutError(
					this.lastRecoverableError && this.lastRecoverableError.time > item.createdAt
						? this.lastRecoverableError.error
						: undefined,
				)
				item.reject(acquireTimeoutError)
				const index = this.queue.indexOf(item)
				if (index > -1) {
					this.queue.splice(index, 1)
				}
				this.log('Queued item timed out')
			}, this.poolConfig.acquireTimeoutMs)

			const item = new PendingItem(it => {
				clearTimeout(timeout)
				resolve(it)
			}, it => {
				clearTimeout(timeout)
				reject(it)
			})

			this.queue.push(item)
		})
	}


	private handleAvailableConnection(poolConnection: PoolConnection) {
		const item = this.queue.shift()
		if (item) {
			this.active.add(poolConnection)
			item.resolve(poolConnection)
			this.log(`Queued item fulfilled with ${poolConnection.uses > 0 ? 'released' : 'new'} connection.`)
			poolConnection.uses++
			return
		}
		if (this.idle.length >= this.poolConfig.maxIdle) {
			setImmediate(async () => {
				await this.disposeConnection(poolConnection)
				this.log('Too many idle connections, connection disposed.')
			})
		} else {
			poolConnection.timerId = setTimeout(async () => {
				const index = this.idle.indexOf(poolConnection)
				if (index > -1) {
					this.idle.splice(index, 1)
					await this.disposeConnection(poolConnection)
					this.log('Idle connection disposed after timeout.')
				}
			}, this.poolConfig.idleTimeoutMs)
			this.idle.push(poolConnection)
			this.log('Connection is idle and available.')
		}
	}

	private async disposeConnection(connection: PoolConnection) {
		try {
			if (connection.disposed) {
				throw new PoolError('Connection is already disposed')
			}
			connection.disposed = true
			await connection.client.end()
		} catch (e: any) {
			this.on('error', e)
		}
	}

	private log(message: string) {
		if (!this.poolConfig.log) return
		const poolStatus = this.getPoolStatus()
		this.poolConfig.log(message, poolStatus)
	}
}

export { Pool }

export class PoolError extends DatabaseError {
}

export class AcquireTimeoutError extends PoolError {
	constructor(previous: any) {
		super('Failed to acquire a connection' + (previous && 'message' in previous ? `. Last error: ${previous.message}` : ''), previous)
	}
}

export class PoolClosedError extends PoolError {
	constructor() {
		super('Pool is already closed')
	}
}
