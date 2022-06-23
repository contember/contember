import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { createBaseIdpQuery } from './helpers.js'
import { IdentityProviderRow } from './types.js'

export class IdentityProviderBySlugQuery extends DatabaseQuery<IdentityProviderRow | null> {
	constructor(private readonly slug: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<IdentityProviderRow | null> {
		const rows = await createBaseIdpQuery()
			.where({
				slug: this.slug,
			})
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}
