import { Connection } from '../client/index.js'

export const withDatabaseAdvisoryLock = async <Cn extends Connection.Queryable, Result>(
	connection: Cn,
	lock: number,
	callback: (connection: Cn) => Result | Promise<Result>,
): Promise<Result> => {
	await connection.query(`select pg_advisory_lock(?)`, [lock])
	try {
		return await callback(connection)
	} finally {
		const result = await connection.query<{lockReleased: boolean}>('select pg_advisory_unlock(?) as "lockReleased"', [lock])
		if (!result.rows[0].lockReleased) {
			throw new Error('Failed to release migration lock')
		}
	}
}
