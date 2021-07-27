import { SignInErrorCode } from '../../schema'
import { ApiKeyManager } from '../service'
import { PersonQuery, PersonRow } from '../queries'
import { Providers } from '../providers'
import { DatabaseContext, verifyOtp } from '../utils'
import { Response, ResponseError, ResponseOk } from '../utils/Response'

class SignInManager {
	constructor(
		private readonly dbContext: DatabaseContext,
		private readonly apiKeyManager: ApiKeyManager,
		private readonly providers: Providers,
	) {}

	async signIn(email: string, password: string, expiration?: number, otpCode?: string): Promise<SignInResponse> {
		const personRow = await this.dbContext.queryHandler.fetch(PersonQuery.byEmail(email))
		if (personRow === null) {
			return new ResponseError(SignInErrorCode.UnknownEmail, `Person with email ${email} not found`)
		}

		const passwordValid = await this.providers.bcryptCompare(password, personRow.password_hash)
		if (!passwordValid) {
			return new ResponseError(SignInErrorCode.InvalidPassword, `Password does not match`)
		}
		if (personRow.otp_uri && personRow.otp_activated_at) {
			if (!otpCode) {
				return new ResponseError(SignInErrorCode.OtpRequired, `2FA is enabled. OTP token is required`)
			}
			if (!verifyOtp({ uri: personRow.otp_uri }, otpCode)) {
				return new ResponseError(SignInErrorCode.InvalidOtpToken, 'OTP token validation has failed')
			}
		}

		const sessionToken = await this.apiKeyManager.createSessionApiKey(personRow.identity_id, expiration)
		return new ResponseOk(new SignInResult(personRow, sessionToken))
	}
}

export class SignInResult {
	readonly ok = true

	constructor(public readonly person: PersonRow, public readonly token: string) {}
}

export type SignInResponse = Response<SignInResult, SignInErrorCode>

export { SignInManager }
