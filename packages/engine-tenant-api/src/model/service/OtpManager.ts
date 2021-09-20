import { PersonRow } from '../queries'
import { ConfirmOtpCommand, DisableOtpCommand, PrepareOtpCommand } from '../commands'
import { createOtp, DatabaseContext, OtpData, verifyOtp } from '../utils'

export class OtpManager {
	constructor(private readonly dbContext: DatabaseContext) {}

	async prepareOtp(person: PersonRow, label: string): Promise<OtpData> {
		const otp = createOtp(person.email, label)
		await this.dbContext.commandBus.execute(new PrepareOtpCommand(person.id, otp.uri))
		return otp
	}

	async confirmOtp(person: PersonRow): Promise<void> {
		await this.dbContext.commandBus.execute(new ConfirmOtpCommand(person.id))
	}

	async disableOtp(person: PersonRow): Promise<void> {
		await this.dbContext.commandBus.execute(new DisableOtpCommand(person.id))
	}

	verifyOtp(person: PersonRow, token: string): boolean {
		if (!person.otp_uri) {
			throw new OtpError('not configured')
		}
		return verifyOtp({ uri: person.otp_uri }, token)
	}
}

export class OtpError extends Error {
	constructor(message?: string) {
		super(message)
	}
}
