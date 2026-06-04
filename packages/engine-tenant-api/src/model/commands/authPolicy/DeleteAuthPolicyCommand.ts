import { Command } from '../Command.js'
import { DeleteBuilder } from '@contember/database'

/** Deletes an `auth_policy` row by id. Returns whether a row was removed. */
export class DeleteAuthPolicyCommand implements Command<boolean> {
	constructor(private readonly id: string) {}

	async execute({ db }: Command.Args): Promise<boolean> {
		const result = await DeleteBuilder.create()
			.from('auth_policy')
			.where({ id: this.id })
			.execute(db)
		return result > 0
	}
}
