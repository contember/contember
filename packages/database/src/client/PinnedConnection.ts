import { Connection } from './Connection.js'
import { EventManager } from './EventManager.js'
import { Client } from './Client.js'
import { PoolStatus } from './Pool.js'

/**
 * Wraps an already-acquired connection so that every query of its owner runs on that single
 * physical connection instead of acquiring a new one from the pool.
 *
 * Used when consecutive statements must observe the same server state (e.g. the same replica with
 * the same replication position). `AcquiredConnection` serializes concurrent use with its mutex, so
 * parallel resolvers are safe here — they just do not run in parallel on the server.
 */
export class PinnedConnection implements Connection.ConnectionType {
	constructor(
		private readonly acquired: Connection.AcquiredConnectionLike,
		private readonly poolStatusProvider: Connection.PoolStatusProvider,
		public readonly eventManager: EventManager = acquired.eventManager,
	) {
	}

	createClient(schema: string, queryMeta: Record<string, any>): Client {
		return new Client(this, schema, queryMeta, new EventManager(this.eventManager))
	}

	async scope<Result>(
		callback: (connection: Connection.AcquiredConnectionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		return await this.acquired.scope(callback, options)
	}

	async transaction<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		return await this.acquired.transaction(callback, options)
	}

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters: any[] = [],
		meta: Record<string, any> = {},
	): Promise<Connection.Result<Row>> {
		return await this.acquired.query(sql, parameters, meta)
	}

	getPoolStatus(): PoolStatus | undefined {
		return this.poolStatusProvider.getPoolStatus()
	}
}
