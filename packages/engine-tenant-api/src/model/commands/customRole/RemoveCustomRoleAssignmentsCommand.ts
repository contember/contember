import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

export class RemoveCustomRoleAssignmentsCommand implements Command<number> {
	constructor(private readonly slug: string) {
	}

	async execute({ db }: Command.Args): Promise<number> {
		return await UpdateBuilder.create()
			.table('identity')
			.where(expr => expr.raw('roles \\? ?', this.slug))
			.values({
				roles: expr => expr.raw('roles - ?', this.slug),
			})
			.execute(db)
	}
}
