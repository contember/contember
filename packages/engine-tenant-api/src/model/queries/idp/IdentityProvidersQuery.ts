import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { createBaseIdpQuery } from './helpers'
import { IdentityProviderRow } from './types'

export class IdentityProvidersQuery extends DatabaseQuery<IdentityProviderRow[]> {
	async fetch({ db }: DatabaseQueryable): Promise<IdentityProviderRow[]> {
		return await createBaseIdpQuery()
			.getResult(db)
	}
}
