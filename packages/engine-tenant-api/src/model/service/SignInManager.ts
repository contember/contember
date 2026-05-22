import { CreateSessionTokenErrorCode, MfaEnrollment, SignInErrorCode } from '../../schema'
import { ApiKeyManager, AuthPolicyResolver, BackupCodeManager, EmailOtpManager, OtpManager } from '../service'
import { PersonQuery, PersonRow, PersonUniqueIdentifier } from '../queries'
import { Providers } from '../providers'
import { DatabaseContext } from '../utils'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { ImplementationException } from '../../exceptions'
import { AuthLogService } from './AuthLogService'
import { ApiKeyRequestInfo, SetMfaGraceUntilCommand } from '../commands'

/**
 * MFA grace duration (seconds) granted on first sign-in against a requiring role
 * with no factor. Per the design, the default is 0 (immediate enforcement); the
 * value is sourced from this single constant so a config knob can replace it
 * later without touching the enforcement logic. Keep it 0 to preserve behavior.
 */
const MFA_GRACE_DURATION_SECONDS = 0

class SignInManager {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly providers: Providers,
		private readonly otpManager: OtpManager,
		private readonly backupCodeManager: BackupCodeManager,
		private readonly emailOtpManager: EmailOtpManager,
		private readonly authPolicyResolver: AuthPolicyResolver,
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
		const hasActiveTotp = Boolean(person.otp_secret && person.otp_activated_at)
		if (hasActiveTotp) {
			// Active TOTP takes precedence (A07 path, unchanged).
			if (otpCode) {
				if (!await this.otpManager.verifyOtp(dbContext, person, otpCode)) {
					return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
				}
			} else if (backupCode) {
				if (!await this.backupCodeManager.verifyAndConsume(dbContext, person, backupCode)) {
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
				if (!await this.backupCodeManager.verifyAndConsume(dbContext, person, backupCode)) {
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
		} else {
			// No active factor at all (A06). Enforce MFA if a matching auth_policy
			// requires it. With no policy rows configured this resolves to
			// mfaRequired=false and sign-in proceeds exactly as before.
			const enforcement = await this.enforceMfaEnrollment(dbContext, person, otpCode, authLogData)
			if (enforcement !== null) {
				if ('error' in enforcement) {
					return enforcement
				}
				// Enrollment completed in this request (pending TOTP promoted to active).
				const sessionToken = await this.apiKeyManager.createSessionApiKey(
					dbContext,
					person.identity_id,
					expiration,
					requestInfo,
					trustForwardedInfo,
				)
				return new ResponseOk({ person, token: sessionToken, backupCodes: enforcement.backupCodes, ...authLogData })
			}
		}

		const sessionToken = await this.apiKeyManager.createSessionApiKey(dbContext, person.identity_id, expiration, requestInfo, trustForwardedInfo)

		return new ResponseOk({ person, token: sessionToken, usedBackupCode, ...authLogData })
	}

	/**
	 * A06 enforcement for the no-active-factor case. Returns:
	 * - `null` when MFA is not required, or grace currently allows sign-in
	 *   (caller proceeds to issue a session as normal). With zero auth_policy
	 *   rows this is always the outcome — no behavior change.
	 * - a `ResponseError` (MFA_ENROLLMENT_REQUIRED with the pending secret to
	 *   enroll, or INVALID_OTP_TOKEN) when sign-in must be blocked.
	 * - `{ ok: true, backupCodes }` when enrollment just completed (pending TOTP
	 *   promoted to active); caller issues the session.
	 */
	private async enforceMfaEnrollment(
		dbContext: DatabaseContext,
		person: PersonRow,
		otpCode: string | undefined,
		authLogData: { [AuthLogService.Key]: AuthLogService.Bag },
	): Promise<
		| null
		| ResponseError<SignInErrorCode, {
			emailOtpSent?: boolean
			mfaEnrollmentRequired?: boolean
			mfaEnrollment?: MfaEnrollment
			[AuthLogService.Key]: AuthLogService.Bag
		}>
		| { backupCodes: string[] }
	> {
		const policy = await this.authPolicyResolver.resolveForIdentity(dbContext, person.identity_id, person.roles)
		if (!policy.mfaRequired) {
			return null
		}

		const now = this.providers.now()

		// Grace handling. Default grace duration is 0 (immediate enforcement), so
		// by default neither branch below opens a window.
		if (person.mfa_grace_until !== null) {
			if (person.mfa_grace_until.getTime() > now.getTime()) {
				// Still inside an open grace window — allow sign-in.
				return null
			}
			// Grace expired → fall through to enforcement.
		} else if (MFA_GRACE_DURATION_SECONDS > 0) {
			// Open the grace window now and allow this sign-in.
			const graceUntil = new Date(now.getTime() + MFA_GRACE_DURATION_SECONDS * 1000)
			await dbContext.commandBus.execute(new SetMfaGraceUntilCommand(person.id, graceUntil))
			return null
		}

		// Enforce.
		if (otpCode && person.otp_pending_secret) {
			// Enrollment completion: verify against the pending secret, then promote.
			if (!await this.otpManager.verifyPendingOtp(person, otpCode)) {
				return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
			}
			await this.otpManager.confirmOtp(dbContext, person)
			const backupCodes = await this.backupCodeManager.generate(dbContext, person.id)
			return { backupCodes }
		}

		// Provision a fresh pending TOTP secret and ask the client to enroll.
		const otp = await this.otpManager.prepareOtp(dbContext, person, 'Contember')
		const mfaEnrollment: MfaEnrollment = { otpUri: otp.uri, otpSecret: otp.secret }
		return new ResponseError('MFA_ENROLLMENT_REQUIRED', 'MFA enrollment is required', {
			mfaEnrollmentRequired: true,
			mfaEnrollment,
			...authLogData,
		})
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
	/** Set when sign-in completed an MFA enrollment (A06): the freshly issued backup codes, shown once. */
	readonly backupCodes?: string[]
	[AuthLogService.Key]: AuthLogService.Bag
}

export type SignInResponse = Response<SignInResult, SignInErrorCode, {
	/** Set on an OTP_REQUIRED error when an email-OTP code was just dispatched (A05). */
	emailOtpSent?: boolean
	/** Set on a MFA_ENROLLMENT_REQUIRED error (A06): triggers the `mfa_enrollment_required` audit. */
	mfaEnrollmentRequired?: boolean
	/** Set on a MFA_ENROLLMENT_REQUIRED error (A06): the pending secret the client must enroll. */
	mfaEnrollment?: MfaEnrollment
	[AuthLogService.Key]: AuthLogService.Bag
}>
export type CreateSessionTokenResponse = Response<SignInResult, CreateSessionTokenErrorCode, {
	[AuthLogService.Key]: AuthLogService.Bag
}>

export { SignInManager }
