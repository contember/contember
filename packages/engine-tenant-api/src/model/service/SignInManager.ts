import { CreateSessionTokenErrorCode, SignInErrorCode } from '../../schema'
import { ApiKeyManager, OtpAuthenticator } from '../service'
import { PersonQuery, PersonRow, PersonUniqueIdentifier } from '../queries'
import { Providers } from '../providers'
import { DatabaseContext } from '../utils'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { ImplementationException } from '../../exceptions'

class SignInManager {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly providers: Providers,
		private readonly otpAuthenticator: OtpAuthenticator,
	) {}

	async signIn(dbContext: DatabaseContext, email: string, password: string, expiration?: number, otpCode?: string): Promise<SignInResponse> {
		const personRow = await dbContext.queryHandler.fetch(PersonQuery.byEmail(email))

		if (personRow === null) {
			return new ResponseError('UNKNOWN_EMAIL', `Person with email ${email} not found`)
		}

		if (!personRow.password_hash) {
			return new ResponseError('NO_PASSWORD_SET', `No password set`)
		}

		if (personRow.disabled_at !== null) {
			return new ResponseError('PERSON_DISABLED', `Person is disabled`)
		}

		const passwordValid = await this.providers.bcryptCompare(password, personRow.password_hash)

		if (!passwordValid) {
			return new ResponseError('INVALID_PASSWORD', `Password does not match`)
		}

		if (personRow.otp_uri && personRow.otp_activated_at) {
			if (!otpCode) {
				return new ResponseError('OTP_REQUIRED', `2FA is enabled. OTP token is required`)
			}

			if (!this.otpAuthenticator.validate({ uri: personRow.otp_uri }, otpCode)) {
				return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed')
			}
		}

		const sessionToken = await this.apiKeyManager.createSessionApiKey(dbContext, personRow.identity_id, expiration)

		return new ResponseOk(new SignInResult(personRow, sessionToken))
	}

	async createSessionToken(
		dbContext: DatabaseContext,
		personIdentifier: PersonUniqueIdentifier,
		expiration?: number,
		verifier?: (person: PersonRow) => Promise<void>,
	): Promise<CreateSessionTokenResponse> {
		const personRow = await dbContext.queryHandler.fetch(PersonQuery.byUniqueIdentifier(personIdentifier))

		if (personRow === null) {
			if (personIdentifier.type === 'email') {
				return new ResponseError('UNKNOWN_EMAIL', `Person with email ${personIdentifier.email} not found`)

			} else if (personIdentifier.type === 'id') {
				return new ResponseError('UNKNOWN_PERSON_ID', `Person with id ${personIdentifier.id} not found`)
			}

			throw new ImplementationException()
		}

		if (personRow.disabled_at !== null) {
			return new ResponseError('PERSON_DISABLED', `Person with id ${personRow.id} is disabled`)
		}

		await verifier?.(personRow)

		const sessionToken = await this.apiKeyManager.createSessionApiKey(dbContext, personRow.identity_id, expiration)
		return new ResponseOk(new SignInResult(personRow, sessionToken))
	}
}

export class SignInResult {
	constructor(
		public readonly person: PersonRow,
		public readonly token: string,
	) {}
}

export type SignInResponse = Response<SignInResult, SignInErrorCode>
export type CreateSessionTokenResponse = Response<SignInResult, CreateSessionTokenErrorCode>

export { SignInManager }
