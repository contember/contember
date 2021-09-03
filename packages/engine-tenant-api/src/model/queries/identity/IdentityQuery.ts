import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

export class IdentityQuery extends DatabaseQuery<IdentityQueryResult[]> {
	constructor(private readonly ids: string[]) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<IdentityQueryResult[]> {
		const qb = await SelectBuilder.create<{ id: string; description: string | null }>()
			.select('id')
			.select('description')
			.from('identity')
			.where(expr => expr.in('id', this.ids))
			.getResult(queryable.db)

		return qb.map(it => ({ ...it, description: it.description || '' }))
	}
}

export interface IdentityQueryResult {
	id: string
	description: string
}
