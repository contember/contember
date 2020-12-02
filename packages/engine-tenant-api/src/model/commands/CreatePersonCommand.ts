import { Command } from './Command'
import { PersonRow } from '../queries'
import { InsertBuilder } from '@contember/database'

export class CreatePersonCommand implements Command<Omit<PersonRow, 'roles'>> {
	constructor(private readonly identityId: string, private readonly email: string, private readonly password: string) {}

	async execute({ db, providers }: Command.Args): Promise<Omit<PersonRow, 'roles'>> {
		const id = providers.uuid()

		const password_hash = await providers.bcrypt(this.password)
		await InsertBuilder.create()
			.into('person')
			.values({
				id: id,
				email: this.email,
				password_hash,
				identity_id: this.identityId,
			})
			.execute(db)

		return { id, email: this.email, password_hash, identity_id: this.identityId, otp_uri: null, otp_activated_at: null }
	}
}
