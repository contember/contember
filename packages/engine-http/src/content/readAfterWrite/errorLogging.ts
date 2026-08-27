import { DatabaseError } from '@contember/database'
import { LoggerAttributes } from '@contember/logger'

/**
 * Log attributes of a failed database call. Only the code and the raw server message are taken:
 * QueryError.message embeds the SQL and its parameters, which here are the client's write refs.
 */
export const databaseErrorAttributes = (error: unknown): LoggerAttributes =>
	error instanceof DatabaseError
		? { errorCode: error.code, errorMessage: error.originalMessage }
		: {}
