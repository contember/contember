import { Client } from '@contember/database'

/**
 * Fixed namespace (classid) for scheduler advisory locks. Postgres keeps the two-int `(classid, objid)`
 * lock space separate from the single-`bigint` space that migrations use, so these never collide with
 * migration locks. The per-(project, job) objid is a stable 32-bit hash.
 */
const SCHEDULER_LOCK_CLASS = 0x5c48 // "ScH"

/** Stable signed 32-bit hash (fits Postgres int4) for the advisory lock objid. */
const hashToInt32 = (key: string): number => {
	let hash = 0
	for (let i = 0; i < key.length; i++) {
		hash = (Math.imul(hash, 31) + key.charCodeAt(i)) | 0
	}
	return hash
}

export const schedulerLockId = (projectSlug: string, jobName: string): number => hashToInt32(`${projectSlug}:${jobName}`)

/**
 * Non-blocking session advisory lock — returns whether it was acquired. Must run on a held connection
 * (call inside `db.scope`) so the matching {@link advisoryUnlock} releases the same session's lock.
 */
export const tryAdvisoryLock = async (client: Client, objectId: number): Promise<boolean> => {
	const result = await client.query<{ locked: boolean }>('SELECT pg_try_advisory_lock(?, ?) AS locked', [SCHEDULER_LOCK_CLASS, objectId])
	return result.rows[0].locked
}

export const advisoryUnlock = async (client: Client, objectId: number): Promise<void> => {
	await client.query('SELECT pg_advisory_unlock(?, ?)', [SCHEDULER_LOCK_CLASS, objectId])
}
