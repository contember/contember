import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

export class IdentityQuery extends DatabaseQuery<Identity[]> {
	constructor(private readonly ids: string[]) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<Identity[]> {
		const qb = await SelectBuilder.create<{ id: string; description: string | null }>()
			.select('id')
			.select('description')
			.from('identity')
			.where(expr => expr.in('id', this.ids))
			.getResult(queryable.db)

		return qb.map(it => ({ ...it, description: it.description || '' }))
	}
}

export interface Identity {
	id: string
	description: string
}
