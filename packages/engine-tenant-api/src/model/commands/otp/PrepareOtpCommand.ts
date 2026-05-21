import { Command } from '../Command.js'
import { ConflictActionType, InsertBuilder } from '@contember/database'

/**
 * Writes a freshly generated TOTP secret into the *pending* slot of person_mfa.
 * The active secret (if any) is left untouched, so starting a re-enrollment never
 * destroys a working factor. The secret is always encrypted (version >= 1).
 */
export class PrepareOtpCommand implements Command<void> {
	constructor(private readonly personId: string, private readonly secret: string) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const encrypted = await providers.encrypt(Buffer.from(this.secret, 'utf8'))
		const now = providers.now()
		await InsertBuilder.create()
			.into('person_mfa')
			.values({
				person_id: this.personId,
				totp_pending_secret: encrypted.value,
				totp_pending_version: encrypted.version,
				totp_pending_created_at: now,
			})
			.onConflict(ConflictActionType.update, ['person_id'], {
				totp_pending_secret: encrypted.value,
				totp_pending_version: encrypted.version,
				totp_pending_created_at: now,
			})
			.execute(db)
	}
}
