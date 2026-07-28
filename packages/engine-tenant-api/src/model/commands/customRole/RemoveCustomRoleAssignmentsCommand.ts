import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

/** Returns the identities the slug was stripped from, so the delete can audit who actually lost it. */
export class RemoveCustomRoleAssignmentsCommand implements Command<string[]> {
	constructor(private readonly slug: string) {
	}

	async execute({ db }: Command.Args): Promise<string[]> {
		const result = await UpdateBuilder.create()
			.table('identity')
			.where(expr => expr.raw('roles \\? ?', this.slug))
			.values({
				roles: expr => expr.raw('roles - ?', this.slug),
			})
			.returning('id')
			.execute(db)
		return result.map(row => row.id as string)
	}
}
