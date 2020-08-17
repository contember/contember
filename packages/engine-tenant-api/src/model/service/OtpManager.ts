import { PersonRow } from '../queries'
import { CommandBus, ConfirmOtpCommand, DisableOtpCommand, PrepareOtpCommand } from '../commands'
import { createOtp, OtpData, verifyOtp } from '../utils/otp'

export class OtpManager {
	constructor(private readonly commandBus: CommandBus) {}

	async prepareOtp(person: PersonRow, label: string): Promise<OtpData> {
		const otp = createOtp(person.email, label)
		await this.commandBus.execute(new PrepareOtpCommand(person.id, otp.uri))
		return otp
	}

	async confirmOtp(person: PersonRow): Promise<void> {
		await this.commandBus.execute(new ConfirmOtpCommand(person.id))
	}

	async disableOtp(person: PersonRow): Promise<void> {
		await this.commandBus.execute(new DisableOtpCommand(person.id))
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
