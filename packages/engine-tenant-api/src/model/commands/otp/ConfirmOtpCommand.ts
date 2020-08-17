import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'

export class ConfirmOtpCommand implements Command<void> {
	constructor(private readonly personId: string) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person')
			.values({
				otp_activated_at: providers.now(),
			})
			.where({
				id: this.personId,
			})
			.execute(db)
	}
}
