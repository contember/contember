import { CannotCommitError, ClientError, ClientErrorCodes, TransactionAbortedError } from '@contember/database'

/** SQLSTATEs after which the session, not just the statement, is unusable for the next request. */
const compromisingErrorCodes: ReadonlySet<string> = new Set<string>([
	ClientErrorCodes.CONNECTION_EXCEPTION,
	ClientErrorCodes.CONNECTION_DOES_NOT_EXIST,
	ClientErrorCodes.CONNECTION_FAILURE,
	ClientErrorCodes.TRANSACTION_RESOLUTION_UNKNOWN,
	ClientErrorCodes.PROTOCOL_VIOLATION,
	ClientErrorCodes.IN_FAILED_SQL_TRANSACTION,
	ClientErrorCodes.IDLE_IN_TRANSACTION_SESSION_TIMEOUT,
	ClientErrorCodes.ADMIN_SHUTDOWN,
	ClientErrorCodes.CRASH_SHUTDOWN,
	ClientErrorCodes.DATABASE_DROPPED,
	ClientErrorCodes.IDLE_SESSION_TIMEOUT,
])

/**
 * Verdict on a statement that failed on the connection, from the raw driver error. A failure without a
 * SQLSTATE never reached the server, so it is the socket that broke, not the query.
 */
export const queryFailureCompromisesConnection = (error: unknown): boolean => {
	const code = (error as { code?: unknown } | null | undefined)?.code
	return typeof code !== 'string' || compromisingErrorCodes.has(code)
}

/** Verdict on an error that escaped the request: only these say the connection or its transaction is spent. */
export const errorCompromisesConnection = (error: unknown): boolean =>
	error instanceof ClientError || error instanceof TransactionAbortedError || error instanceof CannotCommitError
