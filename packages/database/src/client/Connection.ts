import { Pool, PoolClient, PoolConfig } from 'pg'
import { EventManager, Client, Transaction } from '../'
import { Interface } from '@contember/utils'

class Connection implements Connection.ConnectionLike, Connection.ClientFactory {
	private readonly pool: Pool

	constructor(
		private readonly config: PoolConfig,
		private readonly queryConfig: Connection.QueryConfig,
		public readonly eventManager: EventManager = new EventManager(),
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
		const transaction = new Transaction(client, new EventManager(this.eventManager), this.queryConfig)
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
		parameters: any[],
		meta: Record<string, any> = {},
		config: Connection.QueryConfig = {},
	): Promise<Connection.Result<Row>> {
		const client = await this.pool.connect()
		const query: Connection.Query = { sql, parameters, meta, ...this.queryConfig, ...config }
		try {
			const result = Connection.executeQuery<Row>(client, this.eventManager, query, {})
			client.release()
			return result
		} catch (e) {
			client.release(e)
			throw e
		}
	}
}

namespace Connection {
	export interface QueryConfig {
		timing?: boolean
	}

	export interface Queryable {
		readonly eventManager: Interface<EventManager>

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

	export async function executeQuery<Row extends Record<string, any>>(
		pgClient: PoolClient,
		eventManager: EventManager,
		{ sql, parameters, meta, timing }: Query & QueryConfig,
		context: QueryContext,
	): Promise<Connection.Result<Row>> {
		try {
			eventManager.fire(EventManager.Event.queryStart, { sql, parameters, meta })

			const exec = async () => await pgClient.query(prepareSql(sql), parameters)

			let result: Connection.Result<Row>
			if (timing) {
				const startHrTime = process.hrtime()
				const startTimeUs = startHrTime[0] * 1e6 + Math.floor(startHrTime[1] / 1000)

				result = await exec()

				const endHrTime = process.hrtime()
				const endTimeUs = endHrTime[0] * 1e6 + Math.floor(endHrTime[1] / 1000)
				const realStart =
					context.previousQueryEnd && context.previousQueryEnd > startTimeUs ? context.previousQueryEnd : startTimeUs
				result = {
					...result,
					timing: {
						selfDuration: endTimeUs - realStart,
						totalDuration: endTimeUs - startTimeUs,
					},
				}
				context.previousQueryEnd = endTimeUs
			} else {
				result = await exec()
			}

			eventManager.fire(EventManager.Event.queryEnd, { sql, parameters, meta }, result)

			return result
		} catch (error) {
			eventManager.fire(EventManager.Event.queryError, { sql, parameters, meta }, error)
			throw new ConnectionError(sql, parameters, error)
		}
	}

	class ConnectionError extends Error {
		public readonly code?: string
		public readonly constraint?: string

		constructor(public readonly sql: string, public readonly parameters: any, public readonly previous: Error | any) {
			super(`Execution of SQL query has failed: 
SQL: ${sql}
parameters: ${parameters}
original message:
${'message' in previous ? previous.message : JSON.stringify(previous)}
`)
			this.code = previous.code
			this.constraint = previous.constraint
		}
	}

	function prepareSql(sql: string) {
		let parameterIndex = 0
		return sql.replace(/(\\*)\?/g, ({}, numOfEscapes) => (numOfEscapes.length % 2 ? '?' : `$${++parameterIndex}`))
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
}

export { Connection }
