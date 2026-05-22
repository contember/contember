import { Command } from '../Command'
import { Literal, Operator, UpdateBuilder } from '@contember/database'

/**
 * Atomically reserves one OTP guess slot for a `person_token`: increments
 * `otp_attempts` only while the token is still unused and below `maxAttempts`,
 * and reports whether a slot was actually reserved (affected-row count).
 *
 * Unlike a read-then-increment, the conditional UPDATE serializes concurrent
 * writers on the row (under READ COMMITTED), so parallel guesses can never
 * collectively exceed `maxAttempts`. A `false` result means the token was already
 * used/replaced or the per-code attempt cap is exhausted.
 */
export class ClaimOtpAttemptCommand implements Command<boolean> {
	constructor(
		private readonly id: string,
		private readonly maxAttempts: number,
	) {}

	async execute({ db }: Command.Args): Promise<boolean> {
		const affected = await UpdateBuilder.create()
			.table('person_token')
			.values({
				otp_attempts: new Literal('otp_attempts + 1'),
			})
			.where({ id: this.id })
			.where(expr => expr.isNull('used_at'))
			.where(expr => expr.compare('otp_attempts', Operator.lt, this.maxAttempts))
			.execute(db)

		return affected > 0
	}
}
