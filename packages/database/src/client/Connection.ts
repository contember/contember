import { EventManager } from './EventManager'
import { Client } from './Client'
import { Pool, PoolConfig, PoolStatus } from './Pool'
import { createPgClientFactory } from '../utils'
import { DatabaseConfig } from '../types'
import { AcquiredConnection } from './AcquiredConnection'
import { Notification } from 'pg'

class Connection implements Connection.ConnectionLike, Connection.ClientFactory, Connection.PoolStatusProvider {
	constructor(
		private readonly pool: Pool,
		public readonly eventManager: EventManager = new EventManager(null),
	) {
		this.pool.on('error', err => {
			this.eventManager.fire(EventManager.Event.clientError, err)
		})
	}

	public static create(
		{ pool = {}, ...config }: DatabaseConfig & { pool?: Omit<PoolConfig, 'logError'> },
		logError: (error: Error) => void,
	): Connection {
		return new Connection(new Pool(createPgClientFactory(config), { ...pool, logError }))
	}

	public static createSingle(
		config: DatabaseConfig,
		logError: (error: Error) => void,
	): Connection {
		return new Connection(new Pool(createPgClientFactory(config), { maxConnections: 1, maxIdle: 0, logError }))
	}

	public createClient(schema: string, queryMeta: Record<string, any>): Client {
		return new Client(this, schema, queryMeta, new EventManager(this.eventManager))
	}

	async scope<Result>(
		callback: (connection: Connection.AcquiredConnectionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		const acquired = await this.pool.acquire()
		const eventManager = new EventManager(options.eventManager ?? this.eventManager)
		try {
			const connection = new AcquiredConnection(acquired.client, eventManager)
			const result = await callback(connection)
			this.pool.release(acquired)

			return result
		} catch (e) {
			this.pool.dispose(acquired)
			throw e
		}
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

	async end(): Promise<void> {
		await this.pool.end()
	}

	public async clearPool(): Promise<void> {
		await this.pool.closeIdle()
	}

	getPoolStatus(): PoolStatus {
		return this.pool.getPoolStatus()
	}
}

namespace Connection {
	export interface Queryable {
		readonly eventManager: EventManager

		query<Row extends Record<string, any>>(
			sql: string,
			parameters?: readonly any[],
			meta?: Record<string, any>,
		): Promise<Connection.Result<Row>>
	}

	export interface Transactional {
		transaction<Result>(
			trx: (connection: TransactionLike) => Promise<Result> | Result,
			options?: { eventManager?: EventManager },
		): Promise<Result>
	}

	export type ConnectionType =
		& Connection.ConnectionLike
		& Connection.ClientFactory
		& Connection.PoolStatusProvider

	export interface ConnectionLike<T = {}> extends Transactional, Queryable {
		scope<Result>(
			callback: (connection: T & AcquiredConnectionLike) => Promise<Result> | Result,
			options?: { eventManager?: EventManager },
		): Promise<Result>
	}

	export interface AcquiredConnectionLike<T = {}> extends ConnectionLike<T> {
		on(event: 'notification', listener: (message: Notification) => void): () => void
		on(event: 'end', listener: () => void): () => void
		on(event: 'error', listener: (error: any) => void): () => void
	}

	export interface ClientFactory {
		createClient(schema: string, queryMeta: Record<string, any>): Client
	}

	export interface PoolStatusProvider {
		getPoolStatus(): PoolStatus | undefined
	}

	export interface TransactionLike extends AcquiredConnectionLike<TransactionLike> {
		readonly isClosed: boolean

		rollback(): Promise<void>

		commit(): Promise<void>
	}

	export interface Query {
		readonly sql: string
		readonly parameters: any[]
		readonly meta: Record<string, any>
	}

	export interface Result<Row extends Record<string, any> = Record<string, any>> {
		readonly rowCount: number
		readonly rows: Row[]
		readonly timing?: {
			selfDuration: number
			/** @deprecated both selfDuration and totalDuration now contains same number */
			totalDuration: number
		}
	}

	export const REPEATABLE_READ = 'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ'

}

export { Connection }
