import KnexWrapper from '../core/knex/KnexWrapper'
import { uuid } from '../utils/uuid'

export const unnamedIdentity = '11111111-1111-1111-1111-111111111111'

export async function setupSystemVariables(knex: KnexWrapper, identityId: string) {
	await Promise.all([
		await knex.query(
			'SELECT set_config(?, ?, false)',
			[
				'tenant.identity_id', // todo rename to system.identity_id
				identityId
			]
		),
		await knex.query('SELECT set_config(?, ?, false)', ['system.transaction_id', uuid()]),
	])
}
