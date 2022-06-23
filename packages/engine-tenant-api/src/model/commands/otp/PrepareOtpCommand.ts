import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

export class PrepareOtpCommand implements Command<void> {
	constructor(private readonly personId: string, private readonly otpUri: string) {}

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person')
			.values({
				otp_uri: this.otpUri,
				otp_activated_at: null,
			})
			.where({
				id: this.personId,
			})
			.execute(db)
	}
}
