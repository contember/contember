import { ClientBase } from 'pg'
import { EventManager } from './EventManager'
import { Connection } from './Connection'
import {
	ConnectionError,
	ForeignKeyViolationError,
	InvalidDataError,
	NotNullViolationError,
	SerializationFailureError,
	TransactionAbortedError,
	UniqueViolationError,
} from './errors'

function prepareSql(sql: string) {
	let parameterIndex = 0
	return sql.replace(/(\\*)\?/g, ({}, numOfEscapes) => (numOfEscapes.length % 2 ? '?' : `$${++parameterIndex}`))
}

export async function executeQuery<Row extends Record<string, any>>(
	pgClient: ClientBase,
	eventManager: EventManager,
	{ sql, parameters, meta, timing }: Connection.Query & Connection.QueryConfig,
	context: Connection.QueryContext,
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

		switch (error.code) {
			case '23502':
				throw new NotNullViolationError(sql, parameters, error)
			case '23503':
				throw new ForeignKeyViolationError(sql, parameters, error)
			case '23505':
				throw new UniqueViolationError(sql, parameters, error)
			case '40001':
				throw new SerializationFailureError(sql, parameters, error)
			case '22P02':
			case '22008':
				throw new InvalidDataError(sql, parameters, error)
			case '25P02':
				throw new TransactionAbortedError(sql, parameters, error)
			default:
				throw new ConnectionError(sql, parameters, error)
		}
	}
}
