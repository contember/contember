import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

export class ChangePasswordCommand implements Command<void> {
	constructor(private readonly personId: string, private readonly password: string) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person')
			.values({
				password_hash: await providers.bcrypt(this.password),
			})
			.where({
				id: this.personId,
			})
			.execute(db)
	}
}
