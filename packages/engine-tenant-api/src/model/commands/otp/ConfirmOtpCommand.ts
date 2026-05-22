import { Command } from '../Command'
import { Literal, UpdateBuilder } from '@contember/database'

/**
 * Promotes the pending TOTP secret to active and clears the pending slot.
 */
export class ConfirmOtpCommand implements Command<void> {
	constructor(private readonly personId: string) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
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
			.execute(db)
	}
}
