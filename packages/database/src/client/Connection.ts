import { Pool, PoolConfig } from 'pg'
import { EventManager, EventManagerImpl } from './EventManager'
import { Client } from './Client'
import { Transaction } from './Transaction'
import { executeQuery } from './execution'

class Connection implements Connection.ConnectionLike, Connection.ClientFactory {
	private readonly pool: Pool

	constructor(
		public readonly config: PoolConfig,
		private readonly queryConfig: Connection.QueryConfig,
		public readonly eventManager: EventManager = new EventManagerImpl(),
	) {
		this.pool = new Pool(config)
	}

	public createClient(schema: string): Client {
		return new Client(this, schema)
	}

	async transaction<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
	): Promise<Result> {
		const client = await this.pool.connect()
		await client.query('BEGIN')
		const transaction = new Transaction(client, new EventManagerImpl(this.eventManager), this.queryConfig)
		try {
			const result = await callback(transaction)

			if (!transaction.isClosed) {
				await transaction.commit()
			}
			client.release()

			return result
		} catch (e) {
			if (!transaction.isClosed) {
				await transaction.rollback()
			}
			client.release(e)
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
		config: Connection.QueryConfig = {},
	): Promise<Connection.Result<Row>> {
		const client = await this.pool.connect()
		const query: Connection.Query = { sql, parameters, meta, ...this.queryConfig, ...config }
		try {
			const result = await executeQuery<Row>(client, this.eventManager, query, {})
			client.release()
			return result
		} catch (e) {
			client.release(e)
			throw e
		}
	}

	getPoolStatus(): { totalCount: number; idleCount: number; waitingCount: number; maxCount: number } {
		return {
			idleCount: this.pool.idleCount,
			totalCount: this.pool.totalCount,
			waitingCount: this.pool.waitingCount,
			maxCount: this.config.max || 10,
		}
	}
}

namespace Connection {
	export interface QueryConfig {
		timing?: boolean
	}

	export interface Queryable {
		readonly eventManager: EventManager

		query<Row extends Record<string, any>>(
			sql: string,
			parameters?: any[],
			meta?: Record<string, any>,
			config?: Connection.QueryConfig,
		): Promise<Connection.Result<Row>>
	}

	export interface Transactional {
		transaction<Result>(trx: (connection: TransactionLike) => Promise<Result> | Result): Promise<Result>
	}

	export interface ConnectionLike extends Transactional, Queryable {}

	export interface ClientFactory {
		createClient(schema: string): Client
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

	export type Credentials = Pick<PoolConfig, 'host' | 'port' | 'user' | 'password' | 'database'>

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
