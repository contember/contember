import { Pool, PoolClient, PoolConfig } from 'pg'
import EventManager from './EventManager'
import { Transaction } from './Transaction'

class Connection implements Connection.Transactional, Connection.Queryable {

	private readonly pool: Pool

	constructor(
		private readonly config: PoolConfig,
		private readonly queryConfig: Connection.QueryConfig,
		public readonly eventManager: EventManager = new EventManager()
	) {
		this.pool = new Pool(config)
	}

	async transaction<Result>(callback: (connection: Connection.TransactionLike) => Promise<Result> | Result): Promise<Result> {
		const client = await this.pool.connect()
		await client.query('BEGIN')
		const transaction = new Transaction(client, this.eventManager, this.queryConfig)
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

	async query(sql: string, parameters: any[], meta: Record<string, any> = {}, config: Connection.QueryConfig = {}): Promise<Connection.Result> {
		const client = await this.pool.connect()
		const query: Connection.Query = { sql, parameters, meta, ...this.queryConfig, ...config }
		try {
			const result = Connection.executeQuery(client, this.eventManager, query, {})
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
		query(sql: string, parameters?: any[], meta?: Record<string, any>, config?: Connection.QueryConfig): Promise<Connection.Result>
	}

	export interface Transactional {
		transaction<Result>(trx: (connection: TransactionLike) => Promise<Result> | Result): Promise<Result>
	}

	export interface ConnectionLike extends Transactional, Queryable
	{

	}

	export interface TransactionLike extends ConnectionLike {
		readonly isClosed: boolean

		rollback(): Promise<void>

		commit(): Promise<void>
	}


	export async function executeQuery(
		pgClient: PoolClient,
		eventManager: EventManager,
		{ sql, parameters, meta, timing }: Query & QueryConfig,
		context: QueryContext
	): Promise<Connection.Result> {
		try {
			eventManager.fire(EventManager.Event.queryStart, { sql, parameters, meta })

			const exec = async () => await pgClient.query(prepareSql(sql), parameters)

			let result: Result
			if (timing) {
				const startHrTime = process.hrtime()
				const startTimeUs = startHrTime[0] * 1e6 + Math.floor(startHrTime[1] / 1000)

				result = await exec()

				const endHrTime = process.hrtime()
				const endTimeUs = endHrTime[0] * 1e6 + Math.floor(endHrTime[1] / 1000)
				const realStart = context.previousQueryEnd && context.previousQueryEnd > startTimeUs ? context.previousQueryEnd : startTimeUs
				result = {
					...result,
					timing: {
						selfDuration: endTimeUs - realStart,
						totalDuration: endTimeUs - startTimeUs,
					}
				}
				context.previousQueryEnd = endTimeUs
			} else {
				result = await exec()
			}

			eventManager.fire(EventManager.Event.queryEnd, { sql, parameters, meta }, result)

			return result
		} catch (error) {
			eventManager.fire(EventManager.Event.queryError, { sql, parameters, meta }, error)
			throw error
		}
	}

	function prepareSql(sql: string) {
		let parameterIndex = 0;
		return sql.replace(/(\\*)\?/g, ({}, numOfEscapes) =>
			numOfEscapes.length % 2 ? '?' : `$${++parameterIndex}`
		);
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


	export interface Result {
		readonly rowCount: number;
		readonly rows: Record<string, any>[]
		readonly timing?: {
			totalDuration: number
			selfDuration: number
		}
	}
}

export default Connection
