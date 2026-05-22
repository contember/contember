import { Command } from '../Command'
import { ConflictActionType, InsertBuilder } from '@contember/database'

/**
 * Writes a freshly prepared TOTP secret into the *pending* slot of person_mfa.
 * The active secret (if any) is left untouched, so starting a re-enrollment never
 * destroys a working factor. The caller ({@link OtpManager.prepareOtp}) decides the
 * stored form: an encrypted base32 secret (version >= 1) when a key is configured,
 * or the plaintext otpauth URI (version 0) when none is.
 */
export class PrepareOtpCommand implements Command<void> {
	constructor(
		private readonly personId: string,
		private readonly secret: Buffer,
		private readonly version: number,
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const now = providers.now()
		await InsertBuilder.create()
			.into('person_mfa')
			.values({
				person_id: this.personId,
				totp_pending_secret: this.secret,
				totp_pending_version: this.version,
				totp_pending_created_at: now,
			})
			.onConflict(ConflictActionType.update, ['person_id'], {
				totp_pending_secret: this.secret,
				totp_pending_version: this.version,
				totp_pending_created_at: now,
			})
			.execute(db)
	}
}
