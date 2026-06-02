import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

/**
 * Admin recovery: clears all of a person's MFA factors so a locked-out user can
 * re-enroll. Clears the active and pending TOTP slots and disables email OTP in
 * `person_mfa`, and clears `person.mfa_grace_until`. Backup codes are deleted
 * separately (DeleteBackupCodesCommand).
 */
export class ResetPersonMfaCommand implements Command<void> {
	constructor(private readonly personId: string) {}

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person_mfa')
			.where({ person_id: this.personId })
			.values({
				totp_secret: null,
				totp_secret_version: null,
				totp_activated_at: null,
				totp_pending_secret: null,
				totp_pending_version: null,
				totp_pending_created_at: null,
				email_otp_enabled: false,
			})
			.execute(db)

		await UpdateBuilder.create()
			.table('person')
			.where({ id: this.personId })
			.values({
				mfa_grace_until: null,
			})
			.execute(db)
	}
}
