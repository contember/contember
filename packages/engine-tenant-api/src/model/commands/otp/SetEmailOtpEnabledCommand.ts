import { Command } from '../Command.js'
import { ConflictActionType, InsertBuilder } from '@contember/database'

/**
 * Toggles the per-person `email_otp_enabled` flag in person_mfa. Upserts so it
 * works even for a person who has no person_mfa row yet (no TOTP enrolled).
 */
export class SetEmailOtpEnabledCommand implements Command<void> {
	constructor(private readonly personId: string, private readonly enabled: boolean) {}

	async execute({ db }: Command.Args): Promise<void> {
		await InsertBuilder.create()
			.into('person_mfa')
			.values({
				person_id: this.personId,
				email_otp_enabled: this.enabled,
			})
			.onConflict(ConflictActionType.update, ['person_id'], {
				email_otp_enabled: this.enabled,
			})
			.execute(db)
	}
}
