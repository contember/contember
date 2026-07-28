import { Command } from '../Command.js'
import { DeleteBuilder } from '@contember/database'

/**
 * Removes a role definition outright. The slug becomes reusable; the audit log
 * (`custom_role_change`) is what preserves the trace of what it used to grant.
 * Callers must strip the slug from every identity in the same transaction —
 * see `RemoveCustomRoleAssignmentsCommand`.
 */
export class DeleteCustomRoleCommand implements Command<boolean> {
	constructor(private readonly slug: string) {}

	async execute({ db }: Command.Args): Promise<boolean> {
		const result = await DeleteBuilder.create()
			.from('custom_role')
			.where({ slug: this.slug })
			.execute(db)
		return result > 0
	}
}
