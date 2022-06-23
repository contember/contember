import { Client } from '@contember/database'
import { UuidProvider } from '../../utils/index.js'

export const unnamedIdentity = '00000000-0000-0000-0000-000000000000'

export async function setupSystemVariables(db: Client, identityId: string, providers: UuidProvider) {
	await Promise.all([
		await db.query('SELECT set_config(?, ?, false)', [
			'tenant.identity_id', // todo rename to system.identity_id
			identityId,
		]),
		await db.query('SELECT set_config(?, ?, false)', ['system.transaction_id', providers.uuid()]),
	])
}
