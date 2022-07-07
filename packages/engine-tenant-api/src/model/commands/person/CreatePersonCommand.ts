import { Command } from '../Command'
import { PersonRow } from '../../queries'
import { InsertBuilder } from '@contember/database'
import { MaybePassword } from '../../dtos/Password'

export class CreatePersonCommand implements Command<Omit<PersonRow, 'roles'>> {
	constructor(private readonly data: {
		identityId: string
		email?: string
		name?: string
		password: MaybePassword
	}) {}

	async execute({ db, providers }: Command.Args): Promise<Omit<PersonRow, 'roles'>> {
		const id = providers.uuid()

		const password_hash = await this.data.password.getHash(providers)
		await InsertBuilder.create()
			.into('person')
			.values({
				id: id,
				email: this.data.email ?? null,
				name: this.data.name ?? this.data.email?.split('@')[0] ?? null,
				password_hash,
				identity_id: this.data.identityId,
			})
			.execute(db)

		return {
			id,
			email: this.data.email,
			password_hash, identity_id:
			this.data.identityId,
			otp_uri: null,
			otp_activated_at: null,
		}
	}
}
