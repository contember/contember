import { DatabaseQuery, DatabaseQueryable, LockType, SelectBuilder } from '@contember/database'

export class IdentityQuery extends DatabaseQuery<IdentityQueryResult[]> {
	constructor(
		private readonly ids: string[],
		private readonly lock?: LockType,
	) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<IdentityQueryResult[]> {
		let query = SelectBuilder.create<{ id: string; description: string | null; roles: string[] }>()
			.select('id')
			.select('description')
			.select('roles')
			.from('identity')
			.where(expr => expr.in('id', this.ids))
		if (this.lock !== undefined) {
			query = query.lock(this.lock)
		}
		const qb = await query.getResult(queryable.db)

		return qb.map(it => ({ ...it, description: it.description || '' }))
	}
}

export interface IdentityQueryResult {
	id: string
	description: string
	roles: string[]
}
