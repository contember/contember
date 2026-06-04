import { Command } from '../Command.js'
import { Literal, UpdateBuilder } from '@contember/database'

/**
 * Promotes the pending TOTP secret to active and clears the pending slot.
 * Returns whether a pending secret was actually promoted.
 *
 * The `totp_pending_secret IS NOT NULL` guard makes the SET read a live value, so a
 * duplicate or lost-race confirm (pending slot already cleared) is a no-op returning
 * `false` — rather than copying NULL into the active secret and silently disabling
 * the user's TOTP.
 */
export class ConfirmOtpCommand implements Command<boolean> {
	constructor(private readonly personId: string) {}

	async execute({ db, providers }: Command.Args): Promise<boolean> {
		const affected = await UpdateBuilder.create()
			.table('person_mfa')
			.values({
				totp_secret: new Literal('"totp_pending_secret"'),
				totp_secret_version: new Literal('"totp_pending_version"'),
				totp_activated_at: providers.now(),
				totp_pending_secret: null,
				totp_pending_version: null,
				totp_pending_created_at: null,
			})
			.where({
				person_id: this.personId,
			})
			.where(expr => expr.isNotNull('totp_pending_secret'))
			.execute(db)

		return affected > 0
	}
}
