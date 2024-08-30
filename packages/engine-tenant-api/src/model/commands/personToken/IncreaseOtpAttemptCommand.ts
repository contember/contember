import { Command } from '../Command'
import { Literal, UpdateBuilder } from '@contember/database'
import { ImplementationException } from '../../../exceptions'

export class IncreaseOtpAttemptCommand implements Command<void> {
	constructor(
		private readonly id: string,
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const count = await UpdateBuilder.create()
			.table('person_token')
			.where({ id: this.id })
			.values({
				otp_attempts: new Literal('otp_attempts + 1'),
			})
			.execute(db)

		if (count === 0) {
			throw new ImplementationException()
		}
	}
}
