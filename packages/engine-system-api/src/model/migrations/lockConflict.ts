import { ClientErrorCodes, QueryError } from '@contember/database'

const lockConflictCodes = new Set<string | undefined>([ClientErrorCodes.LOCK_NOT_AVAILABLE, ClientErrorCodes.T_R_DEADLOCK_DETECTED])

/** A lock timeout or a deadlock: the statement did nothing wrong and may succeed when run again. */
export const isLockConflict = (error: QueryError): boolean => lockConflictCodes.has(error.code)
