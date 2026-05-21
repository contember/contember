import { CreateSessionTokenErrorCode, SignInErrorCode } from '../../schema'
import { ApiKeyManager, BackupCodeManager, EmailOtpManager, OtpManager } from '../service'
import { PersonQuery, PersonRow, PersonUniqueIdentifier } from '../queries'
import { Providers } from '../providers'
import { DatabaseContext } from '../utils'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { ImplementationException } from '../../exceptions'
import { AuthLogService } from './AuthLogService'
import { ApiKeyRequestInfo } from '../commands'

class SignInManager {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly providers: Providers,
		private readonly otpManager: OtpManager,
		private readonly backupCodeManager: BackupCodeManager,
		private readonly emailOtpManager: EmailOtpManager,
	) {}

	async signIn(
		dbContext: DatabaseContext,
		email: string,
		password: string,
		expiration?: number,
		otpCode?: string,
		requestInfo?: ApiKeyRequestInfo,
		trustForwardedInfo?: boolean,
		backupCode?: string,
	): Promise<SignInResponse> {
		const person = await dbContext.queryHandler.fetch(PersonQuery.byEmail(email))

		if (person === null) {
			return new ResponseError('UNKNOWN_EMAIL', `Person with email ${email} not found`, {
				[AuthLogService.Key]: new AuthLogService.Bag({
					personInput: email,
				}),
			})
		}

		const authLogData = {
			[AuthLogService.Key]: new AuthLogService.Bag({
				personInput: email,
				personId: person.id,
			}),
		}
		if (!person.password_hash) {
			return new ResponseError('NO_PASSWORD_SET', `No password set`, authLogData)
		}

		if (person.disabled_at !== null) {
			return new ResponseError('PERSON_DISABLED', `Person is disabled`, authLogData)
		}

		const passwordValid = await this.providers.bcryptCompare(password, person.password_hash)

		if (!passwordValid) {
			return new ResponseError('INVALID_PASSWORD', `Password does not match`, authLogData)
		}

		let usedBackupCode = false
		if (person.otp_secret && person.otp_activated_at) {
			// Active TOTP takes precedence (A07 path, unchanged).
			if (otpCode) {
				if (!await this.otpManager.verifyOtp(person, otpCode)) {
					return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
				}
			} else if (backupCode) {
				if (!await this.backupCodeManager.verifyAndConsume(dbContext, person.id, backupCode)) {
					return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
				}
				usedBackupCode = true
			} else {
				return new ResponseError('OTP_REQUIRED', `2FA is enabled. OTP token is required`, authLogData)
			}
		} else if (person.email_otp_enabled) {
			// No active TOTP, but email OTP is enabled (A05).
			if (otpCode) {
				if (!await this.emailOtpManager.verifyAndConsume(dbContext, person, otpCode)) {
					return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
				}
			} else if (backupCode) {
				if (!await this.backupCodeManager.verifyAndConsume(dbContext, person.id, backupCode)) {
					return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
				}
				usedBackupCode = true
			} else {
				// Dispatch a fresh code and ask the client to retry with otpToken. Reuses
				// the existing OTP_REQUIRED contract so clients that already handle it work.
				await this.emailOtpManager.sendCode(dbContext, person)
				return new ResponseError('OTP_REQUIRED', `2FA is enabled. OTP token is required`, {
					emailOtpSent: true,
					...authLogData,
				})
			}
		}

		const sessionToken = await this.apiKeyManager.createSessionApiKey(dbContext, person.identity_id, expiration, requestInfo, trustForwardedInfo)

		return new ResponseOk({ person, token: sessionToken, usedBackupCode, ...authLogData })
	}

	async createSessionToken(
		dbContext: DatabaseContext,
		personIdentifier: PersonUniqueIdentifier,
		expiration?: number,
		verifier?: (person: PersonRow) => Promise<void>,
		requestInfo?: ApiKeyRequestInfo,
		trustForwardedInfo?: boolean,
	): Promise<CreateSessionTokenResponse> {
		const person = await dbContext.queryHandler.fetch(PersonQuery.byUniqueIdentifier(personIdentifier))

		if (person === null) {
			if (personIdentifier.type === 'email') {
				return new ResponseError('UNKNOWN_EMAIL', `Person with email ${personIdentifier.email} not found`, {
					[AuthLogService.Key]: new AuthLogService.Bag({
						personInput: personIdentifier.email,
					}),
				})
			} else if (personIdentifier.type === 'id') {
				return new ResponseError('UNKNOWN_PERSON_ID', `Person with id ${personIdentifier.id} not found`, {
					[AuthLogService.Key]: new AuthLogService.Bag({
						personInput: personIdentifier.id,
					}),
				})
			}

			throw new ImplementationException()
		}

		const inputValue = personIdentifier.type === 'email' ? personIdentifier.email : personIdentifier.id
		if (person.disabled_at !== null) {
			return new ResponseError('PERSON_DISABLED', `Person with id ${person.id} is disabled`, {
				[AuthLogService.Key]: new AuthLogService.Bag({
					personId: person.id,
					personInput: inputValue,
				}),
			})
		}

		await verifier?.(person)

		const sessionToken = await this.apiKeyManager.createSessionApiKey(dbContext, person.identity_id, expiration, requestInfo, trustForwardedInfo)
		return new ResponseOk({
			person,
			token: sessionToken,
			[AuthLogService.Key]: new AuthLogService.Bag({
				personId: person.id,
				personInput: inputValue,
			}),
		})
	}
}

export interface SignInResult {
	readonly person: PersonRow
	readonly token: string
	/** True when MFA was satisfied by consuming a backup code (instead of a TOTP token). */
	readonly usedBackupCode?: boolean
	[AuthLogService.Key]: AuthLogService.Bag
}

export type SignInResponse = Response<SignInResult, SignInErrorCode, {
	/** Set on an OTP_REQUIRED error when an email-OTP code was just dispatched (A05). */
	emailOtpSent?: boolean
	[AuthLogService.Key]: AuthLogService.Bag
}>
export type CreateSessionTokenResponse = Response<SignInResult, CreateSessionTokenErrorCode, {
	[AuthLogService.Key]: AuthLogService.Bag
}>

export { SignInManager }
