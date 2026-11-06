import { Command } from '../Command.js'
import { Literal, Operator, UpdateBuilder } from '@contember/database'

/** Gives back an attempt reserved by `ClaimOtpAttemptCommand` when the request did not fail on a wrong code. */
export class ReleaseOtpAttemptCommand implements Command<void> {
	constructor(private readonly id: string) {}

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person_token')
			.values({ otp_attempts: new Literal('otp_attempts - 1') })
			.where({ id: this.id })
			.where(expr => expr.compare('otp_attempts', Operator.gt, 0))
			.execute(db)
	}
}
