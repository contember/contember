import { Command } from '../Command.js'
import { Literal, Operator, UpdateBuilder } from '@contember/database'

/** Marks a token as used once its OTP attempts reached `maxAttempts`, so no flow accepts it any more. */
export class InvalidateExhaustedOtpTokenCommand implements Command<void> {
	constructor(
		private readonly id: string,
		private readonly maxAttempts: number,
	) {}

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person_token')
			.values({ used_at: new Literal('now()') })
			.where({ id: this.id })
			.where(expr => expr.isNull('used_at'))
			.where(expr => expr.compare('otp_attempts', Operator.gte, this.maxAttempts))
			.execute(db)
	}
}
