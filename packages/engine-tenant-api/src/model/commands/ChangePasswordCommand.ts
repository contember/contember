import { Command } from './'
import { Client } from '@contember/database'
import bcrypt from 'bcrypt'

class ChangePasswordCommand implements Command<void> {
	constructor(private readonly personId: string, private readonly password: string) {}

	async execute(db: Client): Promise<void> {
		await db
			.updateBuilder()
			.table('person')
			.values({
				password_hash: await bcrypt.hash(this.password, 10),
			})
			.where({
				id: this.personId,
			})
			.execute()
	}
}

export { ChangePasswordCommand }
