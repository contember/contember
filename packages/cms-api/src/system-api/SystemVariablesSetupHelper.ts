import KnexWrapper from '../core/knex/KnexWrapper'
import { uuid } from '../utils/uuid'

export async function setupSystemVariables(knex: KnexWrapper, identityId: string) {
	await Promise.all([
		await knex.raw(
			'SELECT set_config(?, ?, false)',
			'tenant.identity_id', // todo rename to system.identity_id
			identityId
		),
		await knex.raw(
			'SELECT set_config(?, ?, false)',
			'system.transaction_id',
			uuid()
		),
	])
}
