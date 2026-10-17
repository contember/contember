import { ClientErrorCodes, QueryError } from '@contember/database'

const concurrencyConflictCodes = new Set<string | undefined>([
	ClientErrorCodes.LOCK_NOT_AVAILABLE,
	ClientErrorCodes.T_R_DEADLOCK_DETECTED,
	ClientErrorCodes.T_R_SERIALIZATION_FAILURE,
])

/**
 * A lock timeout, a deadlock, or a row changed by a concurrent transaction since the migration's snapshot:
 * the statement did nothing wrong and may succeed when the whole transaction runs again.
 */
export const isConcurrencyConflict = (error: QueryError): boolean => concurrencyConflictCodes.has(error.code)
