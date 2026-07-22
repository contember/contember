import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { CustomRoleRow } from '../../type/index.js'

/** Lists `custom_role` rows, optionally restricted to the given slugs. */
export class CustomRolesQuery extends DatabaseQuery<CustomRoleRow[]> {
	constructor(private readonly filter?: { slugs: readonly string[] }) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<CustomRoleRow[]> {
		const filter = this.filter
		let qb = SelectBuilder.create<CustomRoleRow>()
			.from('custom_role')
			.select(new Literal('*'))
			.orderBy('slug')
		if (filter !== undefined) {
			qb = qb.where(expr => expr.in('slug', filter.slugs))
		}
		return await qb.getResult(db)
	}
}
