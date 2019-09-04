import { Command } from './'
import { PersonRow } from '../queries'

class CreatePersonCommand implements Command<PersonRow> {
	constructor(private readonly identityId: string, private readonly email: string, private readonly password: string) {}

	async execute({ db, providers }: Command.Args): Promise<PersonRow> {
		const id = providers.uuid()

		const password_hash = await providers.bcrypt(this.password)
		await db
			.insertBuilder()
			.into('person')
			.values({
				id: id,
				email: this.email,
				password_hash,
				identity_id: this.identityId,
			})
			.execute()

		return { id, email: this.email, password_hash, identity_id: this.identityId }
	}
}

export { CreatePersonCommand }
