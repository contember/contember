import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

/**
 * Clears both the active and pending TOTP slots. The person_mfa row is kept
 * (it may still carry other factors such as email_otp_enabled).
 */
export class DisableOtpCommand implements Command<void> {
	constructor(private readonly personId: string) {}

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person_mfa')
			.values({
				totp_secret: null,
				totp_secret_version: null,
				totp_activated_at: null,
				totp_pending_secret: null,
				totp_pending_version: null,
				totp_pending_created_at: null,
			})
			.where({
				person_id: this.personId,
			})
			.execute(db)
	}
}
