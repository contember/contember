import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { createBaseIdpQuery, createIdpDto } from './helpers.js'
import { IdentityProviderDto, IdentityProviderRow } from './types.js'

export class IdentityProvidersQuery extends DatabaseQuery<IdentityProviderDto[]> {
	async fetch({ db }: DatabaseQueryable): Promise<IdentityProviderDto[]> {
		return (await createBaseIdpQuery()
			.getResult(db))
			.map(createIdpDto)
	}
}
