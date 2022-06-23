import  pg from 'pg'
import { EventManager } from './EventManager'
import { Connection } from './Connection'
import {
	QueryError,
	ForeignKeyViolationError,
	InvalidDataError,
	NotNullViolationError,
	SerializationFailureError,
	TransactionAbortedError,
	UniqueViolationError,
} from './errors'
import { ClientErrorCodes } from './errorCodes'

function prepareSql(sql: string) {
	let parameterIndex = 0
	return sql.replace(/(\\*)\?/g, ({}, numOfEscapes) => (numOfEscapes.length % 2 ? '?' : `$${++parameterIndex}`))
}
type SomeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export async function executeQuery<Row extends Record<string, any>>(
	pgClient: pg.ClientBase,
	eventManager: EventManager,
	{ sql, parameters, meta, timing }: SomeOptional<Connection.Query, 'parameters' | 'meta'> & Connection.QueryConfig,
	context: Connection.QueryContext = {},
): Promise<Connection.Result<Row>> {
	parameters ??= []
	meta ??= {}
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
}
