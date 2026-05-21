import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'

/**
 * Marks all still-unused `mfa_email_otp` tokens of a person as used. Called before
 * issuing a fresh code so only the latest emailed code can ever verify.
 */
export class InvalidateEmailOtpTokensCommand implements Command<void> {
	constructor(private readonly personId: string) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person_token')
			.where({ person_id: this.personId, type: 'mfa_email_otp' })
			.where(expr => expr.isNull('used_at'))
			.values({
				used_at: providers.now(),
			})
			.execute(db)
	}
}
