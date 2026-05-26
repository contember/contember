import { Command } from '../Command'
import { PersonRow } from '../../queries'
import { InsertBuilder, Literal } from '@contember/database'
import { MaybePassword } from '../../dtos/Password'
import { normalizeEmail } from '../../utils/email'

export class CreatePersonCommand implements Command<Omit<PersonRow, 'roles'>> {
	constructor(
		private readonly data: {
			identityId: string
			email?: string
			name?: string
			password: MaybePassword
			idpOnly?: boolean
			emailVerificationRequired?: boolean
		},
	) {}

	async execute({ db, providers }: Command.Args): Promise<Omit<PersonRow, 'roles'>> {
		const id = providers.uuid()

		const password_hash = await this.data.password.getHash(providers)
		const email = this.data.email ? normalizeEmail(this.data.email) : null
		const name = this.data.name ?? this.data.email?.split('@')[0] ?? null
		const emailVerificationRequired = this.data.emailVerificationRequired ?? false
		await InsertBuilder.create()
			.into('person')
			.values({
				id: id,
				email,
				name: name,
				password_hash,
				identity_id: this.data.identityId,
				idp_only: this.data.idpOnly ?? false,
				email_verification_required: emailVerificationRequired,
			})
			.execute(db)

		return {
			id,
			email,
			name,
			password_hash,
			identity_id: this.data.identityId,
			otp_uri: null,
			otp_activated_at: null,
			disabled_at: null,
			passwordless_enabled: null,
			email_verified_at: null,
			email_verification_required: emailVerificationRequired,
		}
	}
}
