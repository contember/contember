import { Command } from '../Command.js'
import { Literal, Operator, UpdateBuilder } from '@contember/database'

/**
 * Expires a token once its OTP attempts reached `maxAttempts`, so no flow accepts it any more and it answers
 * `TOKEN_EXPIRED`, as an exhausted token always did.
 */
export class ExpireExhaustedOtpTokenCommand implements Command<void> {
	constructor(
		private readonly id: string,
		private readonly maxAttempts: number,
	) {}

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person_token')
			.values({ expires_at: new Literal('now()') })
			.where({ id: this.id })
			.where(expr => expr.isNull('used_at'))
			.where(expr => expr.compare('otp_attempts', Operator.gte, this.maxAttempts))
			.execute(db)
	}
}
