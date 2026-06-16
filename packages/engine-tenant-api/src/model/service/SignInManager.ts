import { CreateSessionTokenErrorCode, MfaEnrollment, SignInErrorCode } from '../../schema/index.js'
import { ApiKeyManager, AuthPolicyResolver, BackupCodeManager, EmailOtpManager, LoginRiskAnalyzer, OtpManager } from '../service/index.js'
import { ConfigurationQuery, PersonQuery, PersonRow, PersonUniqueIdentifier } from '../queries/index.js'
import { Config } from '../type/Config.js'
import { Providers } from '../providers.js'
import { DatabaseContext } from '../utils/index.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { ImplementationException } from '../../exceptions.js'
import { AuthLogService } from './AuthLogService.js'
import { UserMailer } from '../mailing/index.js'
import { ApiKeyRequestInfo, SetMfaGraceUntilCommand } from '../commands/index.js'
import { intervalToSeconds } from '../utils/interval.js'

class SignInManager {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly providers: Providers,
		private readonly otpManager: OtpManager,
		private readonly backupCodeManager: BackupCodeManager,
		private readonly emailOtpManager: EmailOtpManager,
		private readonly authPolicyResolver: AuthPolicyResolver,
		private readonly loginRiskAnalyzer: LoginRiskAnalyzer,
		private readonly userMailer: UserMailer,
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
		config?: Config,
		geoCountry?: string,
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

		// Block sign-in for accounts that were created while email verification
		// was required but never proved ownership. Accounts predating the
		// requirement carry email_verification_required = false and pass through.
		if (person.email_verification_required && person.email_verified_at === null) {
			return new ResponseError('EMAIL_NOT_VERIFIED', `E-mail address has not been verified`, authLogData)
		}

		let usedBackupCode = false
		// Whether a second factor was actively proven in THIS request. Anomaly
		// step-up (A03) reuses this: a login that already cleared a second factor
		// is not asked to step up again.
		let mfaSatisfiedThisRequest = false
		const hasActiveTotp = Boolean(person.otp_secret && person.otp_activated_at)
		if (hasActiveTotp) {
			// Active TOTP takes precedence (A07 path, unchanged).
			if (otpCode) {
				if (!await this.otpManager.verifyOtp(dbContext, person, otpCode)) {
					return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
				}
				mfaSatisfiedThisRequest = true
			} else if (backupCode) {
				if (!await this.backupCodeManager.verifyAndConsume(dbContext, person, backupCode)) {
					return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
				}
				usedBackupCode = true
				mfaSatisfiedThisRequest = true
			} else {
				return new ResponseError('OTP_REQUIRED', `2FA is enabled. OTP token is required`, authLogData)
			}
		} else if (person.email_otp_enabled) {
			// No active TOTP, but email OTP is enabled (A05).
			if (otpCode) {
				if (!await this.emailOtpManager.verifyAndConsume(dbContext, person, otpCode)) {
					return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
				}
				mfaSatisfiedThisRequest = true
			} else if (backupCode) {
				if (!await this.backupCodeManager.verifyAndConsume(dbContext, person, backupCode)) {
					return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
				}
				usedBackupCode = true
				mfaSatisfiedThisRequest = true
			} else {
				// Dispatch a fresh code and ask the client to retry with otpToken. Reuses
				// the existing OTP_REQUIRED contract so clients that already handle it work.
				// The send is rate-limited per person; when throttled nothing is emailed
				// (emailOtpSent: false) but a previously emailed code stays valid.
				// Independent fetch (not the passed-in `config`): the email-OTP send is
				// rate-limited by the live config and this branch never reaches the
				// anomaly analyzer, so query shape stays as before A03.
				const emailOtpConfig = await dbContext.queryHandler.fetch(new ConfigurationQuery(dbContext.providers))
				const decision = await this.emailOtpManager.sendCode(dbContext, person, emailOtpConfig)
				return new ResponseError('OTP_REQUIRED', `2FA is enabled. OTP token is required`, {
					emailOtpSent: decision.ok,
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
				// Enrollment completed in this request (pending TOTP promoted to active),
				// so MFA is definitively satisfied — anomaly step-up cannot apply.
				const riskHandled = await this.applyRiskPolicy(dbContext, person, {
					config,
					geoCountry,
					requestInfo,
					otpCode,
					mfaSatisfiedThisRequest: true,
					authLogData,
				})
				if (riskHandled !== null && 'error' in riskHandled) {
					return riskHandled
				}
				const sessionToken = await this.apiKeyManager.createSessionApiKey(
					dbContext,
					person.identity_id,
					expiration,
					requestInfo,
					trustForwardedInfo,
				)
				return new ResponseOk({
					person,
					token: sessionToken,
					backupCodes: enforcement.backupCodes,
					unusualLoginDetected: riskHandled?.unusualLoginDetected || undefined,
					risk: riskHandled?.risk,
					...authLogData,
				})
			}
		}

		const riskHandled = await this.applyRiskPolicy(dbContext, person, {
			config,
			geoCountry,
			requestInfo,
			otpCode,
			mfaSatisfiedThisRequest,
			authLogData,
		})
		if (riskHandled !== null && 'error' in riskHandled) {
			return riskHandled
		}

		const sessionToken = await this.apiKeyManager.createSessionApiKey(dbContext, person.identity_id, expiration, requestInfo, trustForwardedInfo)

		return new ResponseOk({
			person,
			token: sessionToken,
			usedBackupCode,
			unusualLoginDetected: riskHandled?.unusualLoginDetected || undefined,
			risk: riskHandled?.risk,
			...authLogData,
		})
	}

	/**
	 * A03 — evaluate the sign-in risk score and act per policy. Returns:
	 * - `null` when anomaly detection is off or no `config` was supplied (the
	 *   default): no DB work, sign-in proceeds unchanged.
	 * - `{ unusualLoginDetected: true }` when an informational UNUSUAL_LOGIN email
	 *   was sent (best-effort) but the session may still be issued.
	 * - a `ResponseError('OTP_REQUIRED')` when step-up is required and no code was
	 *   supplied — reuses the email-OTP step-up channel (dispatches a code).
	 * - a `ResponseError('INVALID_OTP_TOKEN')` when a step-up code was supplied but
	 *   did not verify. A valid code consumes the token and the session is issued.
	 * - `{ unusualLoginDetected: false }` when the score was below every threshold.
	 *
	 * The audit entries (`unusual_login_detected`, `step_up_required`) are emitted
	 * by the resolver from the response metadata, matching the project convention.
	 */
	private async applyRiskPolicy(
		dbContext: DatabaseContext,
		person: PersonRow,
		args: {
			config?: Config
			geoCountry?: string
			requestInfo?: ApiKeyRequestInfo
			otpCode?: string
			mfaSatisfiedThisRequest: boolean
			authLogData: { [AuthLogService.Key]: AuthLogService.Bag }
		},
	): Promise<RiskPolicyOutcome> {
		const { config, geoCountry, requestInfo, otpCode, mfaSatisfiedThisRequest, authLogData } = args
		const policy = config?.login.anomalyDetection
		if (!config || !policy?.enabled) {
			return null
		}

		const assessment = await this.loginRiskAnalyzer.analyze(dbContext, person.id, {
			geoCountry: geoCountry ?? null,
			deviceFingerprint: this.loginRiskAnalyzer.fingerprint(requestInfo?.userAgent),
			ip: requestInfo?.ip ?? null,
		}, policy)

		if (assessment.action === 'allow') {
			return { unusualLoginDetected: false }
		}

		const riskMeta = { score: assessment.score, reasons: assessment.reasons }

		if (assessment.action === 'stepUp' && !mfaSatisfiedThisRequest) {
			// Reuse the existing email-OTP step-up channel. This is independent of
			// `person.email_otp_enabled`, which gates email OTP only as the *primary*
			// second factor (A05); the step-up challenge stands on its own, so a person
			// with no standing MFA can still complete it. Without consuming the code
			// here, such a person would never satisfy the step-up and would loop on
			// OTP_REQUIRED forever (the score is unchanged on every retry).
			if (otpCode) {
				// Retry leg: the client resent the emailed code as otpToken. Mirror the
				// A05 contract — an invalid code is rejected (not re-sent); the per-code
				// 3-attempt cap still applies, and a fresh code is issued only when the
				// client retries without a code.
				if (!await this.emailOtpManager.verifyAndConsume(dbContext, person, otpCode)) {
					return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
				}
				// Step-up satisfied this request — fall through to notify + allow below.
			} else {
				// First leg: dispatch a code and ask the client to retry with otpToken.
				// Rate-limited per person; a previously emailed code stays valid when throttled.
				const decision = await this.emailOtpManager.sendCode(dbContext, person, config)
				return new ResponseError('OTP_REQUIRED', 'Additional verification is required for this sign-in', {
					emailOtpSent: decision.ok,
					stepUpRequired: true,
					unusualLoginDetected: true,
					risk: riskMeta,
					...authLogData,
				})
			}
		}

		// action === 'email', or step-up satisfied (already this request, or just now
		// via the emailed code): notify the person of the unusual sign-in. A failed
		// email must never block sign-in.
		await this.sendUnusualLoginEmail(dbContext, person, geoCountry ?? null, requestInfo?.ip ?? null)
		return { unusualLoginDetected: true, risk: riskMeta }
	}

	private async sendUnusualLoginEmail(dbContext: DatabaseContext, person: PersonRow, geoCountry: string | null, ip: string | null): Promise<void> {
		if (!person.email) {
			// No address to notify (e.g. an IDP-only person) — nothing to send.
			return
		}
		try {
			await this.userMailer.sendUnusualLoginEmail(dbContext, {
				email: person.email,
				geoCountry,
				ipAddress: ip,
			}, { projectId: null, variant: '' })
		} catch {
			// ignore — informational only
		}
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

		// Resolve the effective grace duration (seconds). A per-policy override
		// wins; otherwise we fall back to the global config default. Only fetch the
		// config when the override is absent, to keep query shapes minimal.
		let graceSeconds: number
		if (policy.graceDuration !== null) {
			graceSeconds = intervalToSeconds(policy.graceDuration)
		} else {
			const config = await dbContext.queryHandler.fetch(new ConfigurationQuery(dbContext.providers))
			graceSeconds = intervalToSeconds(config.login.mfaGraceDuration)
		}

		// Grace handling. Default grace duration is 0 (immediate enforcement), so
		// by default neither branch below opens a window.
		if (person.mfa_grace_until !== null) {
			if (person.mfa_grace_until.getTime() > now.getTime()) {
				// Still inside an open grace window — allow sign-in.
				return null
			}
			// Grace expired → fall through to enforcement.
		} else if (graceSeconds > 0) {
			// Open the grace window now and allow this sign-in.
			const graceUntil = new Date(now.getTime() + graceSeconds * 1000)
			await dbContext.commandBus.execute(new SetMfaGraceUntilCommand(person.id, graceUntil))
			return null
		}

		// Enforce.
		if (otpCode && person.otp_pending_secret) {
			// Enrollment completion: verify against the pending secret, then promote.
			if (!await this.otpManager.verifyPendingOtp(person, otpCode)) {
				return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
			}
			const promoted = await this.otpManager.confirmOtp(dbContext, person)
			if (!promoted) {
				// Lost a concurrent enrollment-completion race: the pending secret was
				// already promoted by the other request (which issued the backup codes).
				// Don't regenerate here — that would invalidate the codes already
				// returned. TOTP is now active, so a retry signs in via the normal path.
				return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', authLogData)
			}
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

/** A03: greppable payload describing why a sign-in scored as unusual. */
export interface RiskMeta {
	readonly score: number
	readonly reasons: readonly string[]
}

/**
 * Result of {@link SignInManager.applyRiskPolicy}: `null` = feature off / no
 * config; a metadata object when the session may still be issued; a
 * `ResponseError` when step-up blocks the session.
 */
type RiskPolicyOutcome =
	| null
	| { unusualLoginDetected: boolean; risk?: RiskMeta }
	| ResponseError<SignInErrorCode, {
		emailOtpSent?: boolean
		stepUpRequired?: boolean
		unusualLoginDetected?: boolean
		risk?: RiskMeta
		[AuthLogService.Key]: AuthLogService.Bag
	}>

export interface SignInResult {
	readonly person: PersonRow
	readonly token: string
	/** True when MFA was satisfied by consuming a backup code (instead of a TOTP token). */
	readonly usedBackupCode?: boolean
	/** Set when sign-in completed an MFA enrollment (A06): the freshly issued backup codes, shown once. */
	readonly backupCodes?: string[]
	/** A03: true when this sign-in scored as unusual and an UNUSUAL_LOGIN email was sent. */
	readonly unusualLoginDetected?: boolean
	/** A03: the risk score + reasons, recorded in the `unusual_login_detected` audit `event_data`. */
	readonly risk?: RiskMeta
	[AuthLogService.Key]: AuthLogService.Bag
}

export type SignInResponse = Response<SignInResult, SignInErrorCode, {
	/** Set on an OTP_REQUIRED error when an email-OTP code was just dispatched (A05). */
	emailOtpSent?: boolean
	/** Set on a MFA_ENROLLMENT_REQUIRED error (A06): triggers the `mfa_enrollment_required` audit. */
	mfaEnrollmentRequired?: boolean
	/** Set on a MFA_ENROLLMENT_REQUIRED error (A06): the pending secret the client must enroll. */
	mfaEnrollment?: MfaEnrollment
	/** Set on an OTP_REQUIRED error raised by A03 anomaly step-up: triggers the `step_up_required` audit. */
	stepUpRequired?: boolean
	/** A03: true when the sign-in scored as unusual (triggers the `unusual_login_detected` audit). */
	unusualLoginDetected?: boolean
	/** A03: the risk score + reasons, recorded in the audit `event_data`. */
	risk?: RiskMeta
	[AuthLogService.Key]: AuthLogService.Bag
}>
export type CreateSessionTokenResponse = Response<SignInResult, CreateSessionTokenErrorCode, {
	[AuthLogService.Key]: AuthLogService.Bag
}>

export { SignInManager }
