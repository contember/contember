import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

export class DisableOtpCommand implements Command<void> {
	constructor(private readonly personId: string) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person')
			.values({
				otp_uri: null,
				otp_activated_at: null,
			})
			.where({
				id: this.personId,
			})
			.execute(db)
	}
}
