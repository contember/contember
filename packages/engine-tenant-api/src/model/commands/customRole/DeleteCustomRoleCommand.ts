import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

/** Tombstones a role so its slug can never reactivate stale assignments. */
export class DeleteCustomRoleCommand implements Command<boolean> {
	constructor(private readonly slug: string) {}

	async execute({ db, providers }: Command.Args): Promise<boolean> {
		const now = providers.now()
		const result = await UpdateBuilder.create()
			.table('custom_role')
			.where({ slug: this.slug })
			.where(expr => expr.isNull('deleted_at'))
			.values({
				deleted_at: now,
				updated_at: now,
			})
			.execute(db)
		return result > 0
	}
}
