import { DatabaseQuery, DatabaseQueryable, Literal, LockType, SelectBuilder } from '@contember/database'
import { CustomRoleRow } from '../../type/index.js'

/** Lists `custom_role` rows, optionally restricted to the given slugs. */
export class CustomRolesQuery extends DatabaseQuery<CustomRoleRow[]> {
	constructor(
		private readonly filter?: {
			readonly slugs?: readonly string[]
			readonly includeDeleted?: boolean
			readonly lock?: LockType
		},
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<CustomRoleRow[]> {
		const filter = this.filter
		let qb = SelectBuilder.create<CustomRoleRow>()
			.from('custom_role')
			.select(new Literal('*'))
			.orderBy('slug')
		if (filter?.includeDeleted !== true) {
			qb = qb.where(expr => expr.isNull('deleted_at'))
		}
		if (filter?.slugs !== undefined) {
			const slugs = filter.slugs
			qb = qb.where(expr => expr.in('slug', slugs))
		}
		if (filter?.lock !== undefined) {
			qb = qb.lock(filter.lock)
		}
		return await qb.getResult(db)
	}
}
