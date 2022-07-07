import { Command } from '../Command'
import { PersonRow } from '../../queries'
import { InsertBuilder } from '@contember/database'
import { MaybePassword } from '../../dtos/Password'

export class CreatePersonCommand implements Command<Omit<PersonRow, 'roles'>> {
	constructor(private readonly identityId: string, private readonly email: string | undefined, private readonly password: MaybePassword) {}

	async execute({ db, providers }: Command.Args): Promise<Omit<PersonRow, 'roles'>> {
		const id = providers.uuid()

		const password_hash = await this.password.getHash(providers)
		await InsertBuilder.create()
			.into('person')
			.values({
				id: id,
				email: this.email ?? null,
				password_hash,
				identity_id: this.identityId,
			})
			.execute(db)

		return { id, email: this.email, password_hash, identity_id: this.identityId, otp_uri: null, otp_activated_at: null }
	}
}
