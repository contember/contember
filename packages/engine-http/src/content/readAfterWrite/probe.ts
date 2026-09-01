import { Connection } from '@contember/database'
import { Logger } from '@contember/logger'
import { databaseErrorAttributes } from './errorLogging.js'

/**
 * A token is visible when it committed before the connection's current snapshot. `pg_xact_status`
 * alone is not enough: on a replica an id at or above xmax may already be reported as committed by
 * the shared clog while its data has not been applied yet, so anything from xmax up counts as unseen.
 */
const visibilitySql = `WITH s AS MATERIALIZED (SELECT pg_snapshot_xmax(pg_current_snapshot()) AS xmax)
SELECT coalesce(bool_and(CASE WHEN token IS NULL OR token >= s.xmax THEN false
                              ELSE coalesce(pg_xact_status(token) = 'committed', false) END), true) AS visible
FROM unnest(?::xid8[]) AS u(token) CROSS JOIN s`

/**
 * Asks the given replica connection whether it has already applied all of the given write
 * transactions. Must run in autocommit, before any BEGIN, so the answer describes the connection
 * the request is about to use. Never throws: an unusable answer means "serve from the primary".
 */
export const isVisibleOnReplica = async (
	connection: Connection.AcquiredConnectionLike,
	xids: string[],
	logger: Logger,
): Promise<boolean> => {
	if (xids.length === 0) {
		return true
	}
	try {
		const result = await connection.query<{ visible: boolean | null }>(visibilitySql, [xids])
		return result.rows[0]?.visible === true
	} catch (e) {
		logger.warn('Read-after-write: the replica visibility probe failed, serving from the primary', databaseErrorAttributes(e))
		return false
	}
}
