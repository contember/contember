import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

/**
 * Stores a freshly (re-)encrypted active TOTP secret. Used for opportunistic
 * re-encryption on successful verify (legacy version-0 plaintext URIs or
 * key-rotated version>=1 secrets).
 *
 * The update is guarded on the *old* version so a concurrent re-enrollment
 * (which writes a new active secret with a different version) is never clobbered.
 */
export class ReEncryptOtpSecretCommand implements Command<void> {
	constructor(
		private readonly personId: string,
		private readonly secret: Buffer,
		private readonly version: number,
		private readonly oldVersion: number,
	) {}

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person_mfa')
			.values({
				totp_secret: this.secret,
				totp_secret_version: this.version,
			})
			.where({
				person_id: this.personId,
				totp_secret_version: this.oldVersion,
			})
			.execute(db)
	}
}
