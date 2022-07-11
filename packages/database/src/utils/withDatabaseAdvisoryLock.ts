import { Connection } from '../client'

export const withDatabaseAdvisoryLock = async <Result>(
	connection: Connection.ConnectionLike,
	lock: number,
	callback: () => Result | Promise<Result>,
): Promise<Result> => {
	await connection.query(`select pg_advisory_lock(?)`, [lock])
	try {
		return await callback()
	} finally {
		const result = await connection.query<{lockReleased: boolean}>('select pg_advisory_unlock(?) as "lockReleased"', [lock])
		if (!result.rows[0].lockReleased) {
			throw new Error('Failed to release migration lock')
		}
	}
}
