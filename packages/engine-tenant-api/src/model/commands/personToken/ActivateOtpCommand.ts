import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'
import { ImplementationException } from '../../../exceptions'

export class ActivateOtpCommand implements Command<void> {
	constructor(
		private readonly id: string,
		private readonly otpHash: string,
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const count = await UpdateBuilder.create()
			.table('person_token')
			.where({ id: this.id })
			.values({
				otp_hash: this.otpHash,
			})
			.execute(db)

		if (count === 0) {
			throw new ImplementationException()
		}
	}
}
