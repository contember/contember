import { DatabaseError, QueryError } from '@contember/database'
import { LoggerAttributes } from '@contember/logger'

/**
 * Log attributes of a failed database call. Only QueryError.message is withheld: it embeds the SQL
 * and its parameters, which here are the client's write refs.
 */
export const databaseErrorAttributes = (error: unknown): LoggerAttributes => {
	if (!(error instanceof Error)) {
		return { errorType: typeof error }
	}
	const code = error instanceof DatabaseError ? error.code : undefined
	const message = error instanceof QueryError ? error.originalMessage : error.message
	return {
		errorType: error.constructor.name,
		...(code !== undefined ? { errorCode: code } : {}),
		...(message !== undefined ? { errorMessage: message } : {}),
	}
}
