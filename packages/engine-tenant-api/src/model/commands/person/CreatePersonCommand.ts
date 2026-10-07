import { Command } from '../Command.js'
import { PersonRow } from '../../queries/index.js'
import { InsertBuilder, Literal } from '@contember/database'
import { MaybePassword } from '../../dtos/Password.js'
import { normalizeEmail } from '../../utils/email.js'

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
			otp_secret: null,
			otp_secret_version: null,
			otp_activated_at: null,
			otp_pending_secret: null,
			otp_pending_version: null,
			otp_pending_created_at: null,
			email_otp_enabled: false,
			disabled_at: null,
			passwordless_enabled: null,
			mfa_grace_until: null,
			is_in_grace: false,
			email_verified_at: null,
			email_verification_required: emailVerificationRequired,
		}
	}
}
