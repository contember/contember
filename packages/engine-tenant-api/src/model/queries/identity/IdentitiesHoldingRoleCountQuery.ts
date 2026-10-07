import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

/** Counts identities whose global `roles` contain the given role string. */
export class IdentitiesHoldingRoleCountQuery extends DatabaseQuery<number> {
	constructor(private readonly role: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<number> {
		const rows = await SelectBuilder.create<{ count: number }>()
			.select(expr => expr.raw('count(*)::int'), 'count')
			.from('identity')
			.where(expr => expr.raw('roles \\? ?', this.role))
			.getResult(db)
		return rows[0]?.count ?? 0
	}
}
