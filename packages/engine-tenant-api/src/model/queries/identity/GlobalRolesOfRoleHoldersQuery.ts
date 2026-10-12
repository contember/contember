import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

/** Every distinct global role held by an identity whose global `roles` contain the given role string. */
export class GlobalRolesOfRoleHoldersQuery extends DatabaseQuery<string[]> {
	constructor(private readonly role: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<string[]> {
		const rows = await SelectBuilder.create<{ role: string }>()
			.distinct()
			.select(expr => expr.raw('jsonb_array_elements_text(roles)'), 'role')
			.from('identity')
			.where(expr => expr.raw('roles \\? ?', this.role))
			.getResult(db)
		return rows.map(row => row.role)
	}
}
