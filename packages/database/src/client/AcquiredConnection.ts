import { Connection } from './Connection'
import { EventManager } from './EventManager'
import { Mutex } from '../utils'
import { executeTransaction, Transaction } from './Transaction'
import { ClientErrorCodes } from './errorCodes'
import {
	ForeignKeyViolationError,
	InvalidDataError,
	NotNullViolationError,
	QueryError,
	SerializationFailureError,
	TransactionAbortedError,
	UniqueViolationError,
} from './errors'
import { PgClient } from './PgClient'
import { Notification } from 'pg'

export class AcquiredConnection implements Connection.AcquiredConnectionLike {
	private mutex = new Mutex()

	constructor(
		private readonly pgClient: PgClient,
		public readonly eventManager: EventManager,
	) {
	}

	async scope<Result>(
		callback: (connection: Connection.AcquiredConnectionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		return await this.mutex.execute(async () => {
			return await callback(new AcquiredConnection(this.pgClient, options.eventManager ?? this.eventManager))
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
			try {
				this.eventManager.fire(EventManager.Event.queryStart, { sql, parameters, meta })

				let result: Connection.Result<Row>
				const startHrTime = process.hrtime.bigint()

				result = await this.pgClient.query(prepareSql(sql), parameters)

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

	on(event: 'end' | 'notification' | 'error', cb: (() => void) | ((notification: Notification) => void) | ((error: any) => void)) {
		this.pgClient.on(event as any, cb)
		return () => this.pgClient.off(event as any, cb)
	}
}

function prepareSql(sql: string) {
	let parameterIndex = 0
	return sql.replace(/(\\*)\?/g, ({}, numOfEscapes) => (numOfEscapes.length % 2 ? '?' : `$${++parameterIndex}`))
}
