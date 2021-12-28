import { Pool, PoolConfig } from 'pg'
import { EventManager, EventManagerImpl } from './EventManager'
import { Client } from './Client'
import { Transaction } from './Transaction'
import { executeClientOperation, executeQuery } from './execution'

class Connection implements Connection.ConnectionLike, Connection.ClientFactory, Connection.PoolStatusProvider {
	private readonly pool: Pool

	constructor(
		public readonly config: PoolConfig,
		private readonly queryConfig: Connection.QueryConfig,
		public readonly eventManager: EventManager = new EventManagerImpl(),
	) {
		this.pool = new Pool(config)
		this.pool.on('error', err => {
			// eslint-disable-next-line no-console
			console.error(err)
			this.eventManager.fire(EventManager.Event.clientError, err)
		})
	}

	public createClient(schema: string, queryMeta: Record<string, any>): Client {
		return new Client(this, schema, queryMeta)
	}

	async transaction<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
	): Promise<Result> {
		const client = await executeClientOperation(() => this.pool.connect())
		const eventManager = new EventManagerImpl(this.eventManager)
		await executeQuery(client, eventManager, {
			sql: 'BEGIN',
			...this.queryConfig,
		})
		const transaction = new Transaction(client, eventManager, this.queryConfig)
		try {
			const result = await callback(transaction)

			await transaction.commitUnclosed()
			client.release()

			return result
		} catch (e) {
			await transaction.rollbackUnclosed()
			client.release(e as Error)
			throw e
		}
	}

	async end(): Promise<void> {
		await executeClientOperation(() => this.pool.end())
	}

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters: any[] = [],
		meta: Record<string, any> = {},
		config: Connection.QueryConfig = {},
	): Promise<Connection.Result<Row>> {
		const client = await executeClientOperation(() => this.pool.connect())
		const query: Connection.Query = { sql, parameters, meta, ...this.queryConfig, ...config }
		try {
			const result = await executeQuery<Row>(client, this.eventManager, query, {})
			client.release()
			return result
		} catch (e) {
			client.release(e as Error)
			throw e
		}
	}

	getPoolStatus(): Connection.PoolStatus {
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
			parameters?: readonly any[],
			meta?: Record<string, any>,
			config?: Connection.QueryConfig,
		): Promise<Connection.Result<Row>>
	}

	export interface Transactional {
		transaction<Result>(trx: (connection: TransactionLike) => Promise<Result> | Result): Promise<Result>
	}

	export interface ConnectionLike extends Transactional, Queryable {}

	export interface ClientFactory {
		createClient(schema: string, queryMeta: Record<string, any>): Client
	}

	export interface PoolStatusProvider {
		getPoolStatus(): PoolStatus
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

	export type PoolStatus = { totalCount: number; idleCount: number; waitingCount: number; maxCount: number }
}

export { Connection }
