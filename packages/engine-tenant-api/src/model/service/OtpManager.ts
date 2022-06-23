import { PersonRow } from '../queries/index.js'
import { ConfirmOtpCommand, DisableOtpCommand, PrepareOtpCommand } from '../commands/index.js'
import { DatabaseContext } from '../utils/index.js'
import { OtpAuthenticator, OtpData } from './OtpAuthenticator.js'

export class OtpManager {
	constructor(
		private readonly otpAuthenticator: OtpAuthenticator,
	) {}

	async prepareOtp(dbContext: DatabaseContext, person: PersonRow, label: string): Promise<OtpData> {
		const otp = await this.otpAuthenticator.create(person.email, label)
		await dbContext.commandBus.execute(new PrepareOtpCommand(person.id, otp.uri))
		return otp
	}

	async confirmOtp(dbContext: DatabaseContext, person: PersonRow): Promise<void> {
		await dbContext.commandBus.execute(new ConfirmOtpCommand(person.id))
	}

	async disableOtp(dbContext: DatabaseContext, person: PersonRow): Promise<void> {
		await dbContext.commandBus.execute(new DisableOtpCommand(person.id))
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
