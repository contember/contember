import { Connection } from './Connection.js'
import { EventManager } from './EventManager.js'
import { Mutex } from '../utils/index.js'
import { executeTransaction, Transaction } from './Transaction.js'
import { ClientErrorCodes } from './errorCodes.js'
import {
	ForeignKeyViolationError,
	InvalidDataError,
	NotNullViolationError,
	QueryError,
	SerializationFailureError,
	TerminatedConnectionError,
	TransactionAbortedError,
	UniqueViolationError,
} from './errors.js'
import { PgClient } from './PgClient.js'
import { Notification, Query, QueryResult, QueryResultRow } from 'pg'
import { RequestMemoryBudget, RequestMemoryBudgetExceededError } from './RequestMemoryBudget.js'

export class AcquiredConnection implements Connection.AcquiredConnectionLike {
	private mutex = new Mutex()

	constructor(
		private readonly pgClient: PgClient,
		public readonly eventManager: EventManager,
		private readonly physicalConnection = { terminated: false },
	) {
	}

	async scope<Result>(
		callback: (connection: Connection.AcquiredConnectionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		return await this.mutex.execute(async () => {
			return await callback(new AcquiredConnection(this.pgClient, options.eventManager ?? this.eventManager, this.physicalConnection))
		})
	}

	async transaction<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		return await this.scope(async connection => {
			await connection.query('BEGIN', [])
			const transaction = new Transaction(connection)
			return await executeTransaction(transaction, callback)
		}, options)
	}

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters: any[] = [],
		meta: Record<string, any> = {},
	): Promise<Connection.Result<Row>> {
		return await this.mutex.execute(async () => {
			// Refused before any event fires, so cleanup on a terminated connection stays out of query error metrics.
			if (this.physicalConnection.terminated) {
				throw new TerminatedConnectionError()
			}
			try {
				this.eventManager.fire(EventManager.Event.queryStart, { sql, parameters, meta })

				let result: Connection.Result<Row>
				const startHrTime = process.hrtime.bigint()

				const memoryBudget = this.eventManager.memoryBudget
				result = memoryBudget
					? await this.queryWithMemoryBudget<Row>(prepareSql(sql), parameters, memoryBudget)
					: await this.pgClient.query(prepareSql(sql), parameters)

				const endHrTime = process.hrtime.bigint()
				const durationUs = Math.floor(Number(endHrTime - startHrTime) / 1000)
				result = {
					...result,
					timing: {
						selfDuration: durationUs,
						totalDuration: durationUs,
					},
				}

				this.eventManager.fire(EventManager.Event.queryEnd, { sql, parameters, meta }, result)

				return result
			} catch (error) {
				if (!(error instanceof Error)) {
					throw error
				}
				this.eventManager.fire(EventManager.Event.queryError, { sql, parameters, meta }, error)
				if (error instanceof RequestMemoryBudgetExceededError) {
					throw error
				}

				switch ((error as any).code) {
					case ClientErrorCodes.NOT_NULL_VIOLATION:
						throw new NotNullViolationError(sql, parameters, error)
					case ClientErrorCodes.FOREIGN_KEY_VIOLATION:
						throw new ForeignKeyViolationError(sql, parameters, error)
					case ClientErrorCodes.UNIQUE_VIOLATION:
						throw new UniqueViolationError(sql, parameters, error)
					case ClientErrorCodes.T_R_SERIALIZATION_FAILURE:
						throw new SerializationFailureError(sql, parameters, error)
					case ClientErrorCodes.INVALID_TEXT_REPRESENTATION:
					case ClientErrorCodes.DATETIME_FIELD_OVERFLOW:
						throw new InvalidDataError(sql, parameters, error)
					case ClientErrorCodes.IN_FAILED_SQL_TRANSACTION:
						throw new TransactionAbortedError(sql, parameters, error)
					default:
						throw new QueryError(sql, parameters, error)
				}
			}
		})
	}

	private async queryWithMemoryBudget<Row extends QueryResultRow>(
		sql: string,
		parameters: unknown[],
		budget: RequestMemoryBudget,
	): Promise<Connection.Result<Row>> {
		budget.check()
		return await new Promise<Connection.Result<Row>>((resolve, reject) => {
			let rows: Row[] | undefined
			let failure: Error | undefined
			const cleanup = () => budget.signal.removeEventListener('abort', abort)
			const stop = (error: Error) => {
				failure = error
				if (rows) {
					rows.length = 0
				}
				cleanup()
				// A budget failure invalidates this connection; the enclosing pool scope disposes it.
				this.physicalConnection.terminated = true
				void this.pgClient.end().catch(reject)
				reject(error)
			}
			const abort = () => stop(new RequestMemoryBudgetExceededError())
			const config = {
				text: sql,
				values: parameters,
				callback: (error: Error | null, result?: QueryResult<Row>) => {
					cleanup()
					if (failure || error) {
						reject(failure || error)
					} else if (result) {
						resolve(result)
					} else {
						reject(new Error('PostgreSQL query completed without a result'))
					}
				},
			}
			const query = new Query<Row>(config)
			budget.signal.addEventListener('abort', abort, { once: true })
			query.on('row', (row, result) => {
				rows = result?.rows
				if (failure) {
					if (rows) {
						rows.length = 0
					}
					return
				}
				try {
					budget.addDatabaseRow(row)
				} catch (error) {
					if (!failure) {
						stop(error instanceof Error ? error : new Error('Failed to account for database row', { cause: error }))
					}
				}
			})
			try {
				this.pgClient.query(query)
			} catch (error) {
				cleanup()
				reject(error)
			}
		})
	}

	on(event: 'end' | 'notification' | 'error', cb: (() => void) | ((notification: Notification) => void) | ((error: any) => void)) {
		this.pgClient.on(event as any, cb)
		return () => this.pgClient.off(event as any, cb)
	}
}

function prepareSql(sql: string) {
	let parameterIndex = 0
	return sql.replace(/(\\*)\?/g, ({}, numOfEscapes) => (numOfEscapes.length % 2 ? '?' : `$${++parameterIndex}`))
}
