import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

class IdentityProviderQuery extends DatabaseQuery<IdentityProviderQuery.Result> {
	constructor(private readonly slug: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<IdentityProviderQuery.Result> {
		const rows = await SelectBuilder.create<IdentityProviderQuery.Row>()
			.select('id')
			.select('slug')
			.select('type')
			.select('configuration')
			.from('identity_provider')
			.where({
				slug: this.slug,
			})
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}

namespace IdentityProviderQuery {
	export type Row = {
		id: string
		slug: string
		type: string
		configuration: Record<string, unknown>
	}
	export type Result = null | Row
}

export { IdentityProviderQuery }
