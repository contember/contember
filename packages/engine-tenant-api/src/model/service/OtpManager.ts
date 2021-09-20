import { PersonRow } from '../queries'
import { ConfirmOtpCommand, DisableOtpCommand, PrepareOtpCommand } from '../commands'
import { DatabaseContext } from '../utils'
import { OtpAuthenticator, OtpData } from './OtpAuthenticator'

export class OtpManager {
	constructor(
		private readonly dbContext: DatabaseContext,
		private readonly otpAuthenticator: OtpAuthenticator,
	) {}

	async prepareOtp(person: PersonRow, label: string): Promise<OtpData> {
		const otp = await this.otpAuthenticator.create(person.email, label)
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
		return this.otpAuthenticator.validate({ uri: person.otp_uri }, token)
	}
}

export class OtpError extends Error {
	constructor(message?: string) {
		super(message)
	}
}
