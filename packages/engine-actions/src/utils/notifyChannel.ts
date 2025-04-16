import { Client } from '@contember/database'

export const NOTIFY_CHANNEL_NAME = 'actions_event'
export const notify = async (db: Client, projectSlug: string) => {
	await db.query('SELECT pg_notify(?, ?)', [NOTIFY_CHANNEL_NAME, projectSlug])
}
