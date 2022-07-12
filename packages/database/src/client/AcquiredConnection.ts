import { Connection } from './Connection'
import { EventManager } from './EventManager'
import { Mutex } from '../utils'
import { Transaction } from './Transaction'
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

export class AcquiredConnection implements Connection.ConnectionLike {
	private mutex = new Mutex()

	constructor(
		private readonly pgClient: PgClient,
		public readonly eventManager: EventManager,
		private readonly config: Connection.QueryConfig,
	) {
	}

	async scope<Result>(
		callback: (connection: Connection.ConnectionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		return await this.mutex.execute(async () => {
			return await callback(new AcquiredConnection(this.pgClient, options.eventManager ?? this.eventManager, this.config))
		})
	}

	async transaction<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		return await this.scope(async connection => {
			await connection.query('BEGIN', [])
			const transaction = new Transaction(connection)
			try {
				const result = await callback(transaction)

				await transaction.commitUnclosed()

				return result
			} catch (e) {
				await transaction.rollbackUnclosed()
				throw e
			}

		}, options)
	}

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters: any[] = [],
		meta: Record<string, any> = {},
		{ eventManager = this.eventManager, timing = false }: Connection.QueryConfig = {},
	): Promise<Connection.Result<Row>> {
		return await this.mutex.execute(async () => {
			try {
				eventManager.fire(EventManager.Event.queryStart, { sql, parameters, meta })

				const exec = async () => await this.pgClient.query(prepareSql(sql), parameters)

				let result: Connection.Result<Row>
				if (timing) {
					const startHrTime = process.hrtime.bigint()

					result = await exec()

					const endHrTime = process.hrtime.bigint()
					const durationUs = Math.floor(Number(endHrTime - startHrTime) / 1000)
					result = {
						...result,
						timing: {
							selfDuration: durationUs,
							totalDuration: durationUs,
						},
					}
				} else {
					result = await exec()
				}

				eventManager.fire(EventManager.Event.queryEnd, { sql, parameters, meta }, result)

				return result
			} catch (error) {
				if (!(error instanceof Error)) {
					throw error
				}
				eventManager.fire(EventManager.Event.queryError, { sql, parameters, meta }, error)

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
}

function prepareSql(sql: string) {
	let parameterIndex = 0
	return sql.replace(/(\\*)\?/g, ({}, numOfEscapes) => (numOfEscapes.length % 2 ? '?' : `$${++parameterIndex}`))
}
