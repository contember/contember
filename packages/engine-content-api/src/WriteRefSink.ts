import { Connection } from '@contember/database'

/**
 * Collects transaction ids of successfully committed writes, so that the caller can offer read-after-write consistency.
 */
export interface WriteRefSink {
	/** xid8 (decimal string) of a write transaction that has just committed successfully. */
	record(xid: string): void
}

/** Must run inside the write transaction - once it commits, its id is no longer readable. */
export const queryTransactionId = async (db: Connection.Queryable): Promise<string | null> => {
	const result = await db.query<{ xid: string | null }>('SELECT pg_current_xact_id_if_assigned()::text AS xid')
	return result.rows[0]?.xid ?? null
}
