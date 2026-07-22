import { Command } from '../Command.js'
import { DeleteBuilder } from '@contember/database'

/** Deletes a `custom_role` row by slug. Returns whether a row was removed. */
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
