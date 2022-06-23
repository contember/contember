import { EventManager } from './EventManager.js'
import { Client } from './Client.js'
import { Transaction } from './Transaction.js'
import { executeQuery } from './execution.js'
import { Pool, PoolConfig, PoolStatus } from './Pool.js'
import { createPgClientFactory } from '../utils/index.js'
import { DatabaseConfig } from '../types.js'

class Connection implements Connection.ConnectionLike, Connection.ClientFactory, Connection.PoolStatusProvider {
	constructor(
		private readonly pool: Pool,
		private readonly queryConfig: Connection.QueryConfig,
		public readonly eventManager: EventManager = new EventManager(null),
	) {
		this.pool.on('error', err => {
			// eslint-disable-next-line no-console
			console.error(err)
			this.eventManager.fire(EventManager.Event.clientError, err)
		})
	}

	public static create(
		{ pool = {}, ...config }: DatabaseConfig & { pool?: PoolConfig },
		queryConfig: Connection.QueryConfig = {},
	): Connection {
		return new Connection(new Pool(createPgClientFactory(config), pool), queryConfig)
	}

	public createClient(schema: string, queryMeta: Record<string, any>): Client {
		return new Client(this, schema, queryMeta, new EventManager(this.eventManager))
	}

	public async clearPool(): Promise<void> {
		await this.pool.closeIdle()
	}

	async transaction<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		const acquired = await this.pool.acquire()
		const eventManager = new EventManager(options.eventManager ?? this.eventManager)
		await executeQuery(acquired.client, eventManager, {
			sql: 'BEGIN',
			...this.queryConfig,
		})
		const transaction = new Transaction(acquired.client, eventManager, this.queryConfig)
		try {
			const result = await callback(transaction)

			await transaction.commitUnclosed()
			this.pool.release(acquired)

			return result
		} catch (e) {
			await transaction.rollbackUnclosed()
			this.pool.dispose(acquired)
			throw e
		}
	}

	async end(): Promise<void> {
		await this.pool.end()
	}

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters: any[] = [],
		meta: Record<string, any> = {},
		{ eventManager, ...config }: Connection.QueryConfig = {},
	): Promise<Connection.Result<Row>> {
		const client = await this.pool.acquire()
		const query: Connection.Query = { sql, parameters, meta, ...this.queryConfig, ...config }
		try {
			const result = await executeQuery<Row>(client.client, eventManager ?? this.eventManager, query, {})
			this.pool.release(client)
			return result
		} catch (e) {
			this.pool.dispose(client)
			throw e
		}
	}

	getPoolStatus(): PoolStatus {
		return this.pool.getPoolStatus()
	}
}

namespace Connection {
	export interface QueryConfig {
		timing?: boolean
		eventManager?: EventManager
	}

	export interface Queryable {
		readonly eventManager: EventManager

		query<Row extends Record<string, any>>(
			sql: string,
			parameters?: readonly any[],
			meta?: Record<string, any>,
			config?: Connection.QueryConfig,
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

	export interface ConnectionLike extends Transactional, Queryable {}

	export interface ClientFactory {
		createClient(schema: string, queryMeta: Record<string, any>): Client
	}

	export interface PoolStatusProvider {
		getPoolStatus(): PoolStatus | undefined
	}

	export interface TransactionLike extends ConnectionLike {
		readonly isClosed: boolean

		rollback(): Promise<void>

		commit(): Promise<void>
	}

	export interface QueryContext {
		previousQueryEnd?: number
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
			totalDuration: number
			selfDuration: number
		}
	}

	export const REPEATABLE_READ = 'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ'

}

export { Connection }
