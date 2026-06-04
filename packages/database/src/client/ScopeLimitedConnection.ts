import { Connection } from './Connection.js'
import { EventManager } from './EventManager.js'
import { Client } from './Client.js'
import { PoolStatus } from './Pool.js'
import { Semaphore } from '../utils/Semaphore.js'

/**
 * Wraps a {@link Connection} and limits the number of pool connections that may be
 * acquired concurrently through it.
 *
 * Every top-level {@link Connection.scope} call (and therefore every {@link query} and
 * {@link transaction}) acquires exactly one pool connection. By routing those calls
 * through a {@link Semaphore} we cap how many connections a single owner of this
 * instance (typically a single HTTP request) can hold at once, preventing one request
 * from starving the shared pool under high concurrency.
 *
 * Nested scopes/transactions reuse the already-acquired connection (they go through
 * `AcquiredConnection`, not back to the underlying `Connection`), so they are not
 * counted again and cannot deadlock against the limit.
 */
export class ScopeLimitedConnection implements Connection.ConnectionType {
	private readonly semaphore: Semaphore

	constructor(
		private readonly inner: Connection.ConnectionType,
		maxConnections: number,
		public readonly eventManager: EventManager = inner.eventManager,
	) {
		this.semaphore = new Semaphore(maxConnections)
	}

	createClient(schema: string, queryMeta: Record<string, any>): Client {
		return new Client(this, schema, queryMeta, new EventManager(this.eventManager))
	}

	async scope<Result>(
		callback: (connection: Connection.AcquiredConnectionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		return await this.semaphore.execute(() => this.inner.scope(callback, options))
	}

	async transaction<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		return await this.scope(async connection => {
			return await connection.transaction(callback)
		}, options)
	}

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters: any[] = [],
		meta: Record<string, any> = {},
	): Promise<Connection.Result<Row>> {
		return await this.scope(async connection => {
			return await connection.query(sql, parameters, meta)
		})
	}

	getPoolStatus(): PoolStatus | undefined {
		return this.inner.getPoolStatus()
	}
}
