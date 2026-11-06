import { ApiKeyManager } from './apiKey/index.js'
import { ConfigurationQuery, LocalAuthDisablingIdpsQuery, PersonQuery, PersonRow } from '../queries/index.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import {
	ActivatePasswordlessOtpErrorCode,
	InitSignInPasswordlessErrorCode,
	InitSignInPasswordlessResult,
	SignInPasswordlessErrorCode,
} from '../../schema/index.js'
import { DatabaseContext, MAX_OTP_ATTEMPTS, validateToken } from '../utils/index.js'
import { UserMailer } from '../mailing/index.js'
import {
	ActivateOtpCommand,
	ApiKeyRequestInfo,
	ClaimOtpAttemptCommand,
	CreatePersonTokenCommand,
	ExpireExhaustedOtpTokenCommand,
	InvalidateTokenCommand,
	MarkEmailVerifiedCommand,
	ReleaseOtpAttemptCommand,
} from '../commands/index.js'
import { getPreferredProject } from './helpers/getPreferredProject.js'
import { isPasswordlessEnabled } from './helpers/isPasswordlessEnabled.js'
import { ProjectManager } from './ProjectManager.js'
import { PermissionContext } from '../authorization/index.js'
import { PersonTokenQuery } from '../queries/personToken/PersonTokenQuery.js'
import { ImplementationException } from '../../exceptions.js'
import { OtpManager } from './OtpManager.js'
import { BackupCodeManager } from './BackupCodeManager.js'
import { PersonToken } from '../type/index.js'
import { AuthLogService } from './AuthLogService.js'
import { intervalToSeconds } from '../utils/interval.js'
import { NextMailAttemptQuery } from '../queries/authLog/NextMailAttemptQuery.js'
import { EmailAddress } from '../utils/email.js'

class PasswordlessSignInManager {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly mailer: UserMailer,
		private readonly projectManager: ProjectManager,
		private readonly otpManager: OtpManager,
		private readonly backupCodeManager: BackupCodeManager,
	) {}

	async initSignInPasswordless({ db, permissionContext, mailVariant, mailProject, email: emailAddress, emailInput }: {
		db: DatabaseContext
		permissionContext: PermissionContext
		/** Null when the input is not a single address: it names no person. */
		email: EmailAddress | null
		emailInput: string
		mailVariant?: string
		mailProject?: string
	}): Promise<PasswordlessSignInManager.InitSignInPasswordlessResponse> {
		return db.transaction(async (db): Promise<PasswordlessSignInManager.InitSignInPasswordlessResponse> => {
			const configuration = await db.queryHandler.fetch(new ConfigurationQuery(db.providers))
			if (configuration.passwordless.enabled === 'never') {
				return new ResponseError('PASSWORDLESS_DISABLED', 'Passwordless sign-in is disabled', {
					[AuthLogService.Key]: new AuthLogService.Bag({}),
				})
			}

			const person = emailAddress === null ? null : await db.queryHandler.fetch(PersonQuery.byEmail(emailAddress.value))
			// The link, the mail and the backoff use the stored address, never the input: the lookup matches variants of it.
			const email = person?.email ?? null
			if (!person || email === null) {
				return new ResponseError('PERSON_NOT_FOUND', `Person ${emailInput} not found`, {
					[AuthLogService.Key]: new AuthLogService.Bag({
						personInput: emailInput,
					}),
				})
			}
			const exclusiveIdps = await db.queryHandler.fetch(new LocalAuthDisablingIdpsQuery(person.id))
			if (exclusiveIdps.length > 0) {
				return new ResponseError('IDP_REQUIRED', `Sign in using ${exclusiveIdps.join(' or ')}`, {
					[AuthLogService.Key]: new AuthLogService.Bag({
						personInput: email,
						personId: person.id,
					}),
				})
			}

			if (!isPasswordlessEnabled(configuration.passwordless.enabled, person.passwordless_enabled)) {
				return new ResponseError('PASSWORDLESS_DISABLED', 'Passwordless sign-in is disabled for this person', {
					[AuthLogService.Key]: new AuthLogService.Bag({
						personInput: email,
						personId: person.id,
					}),
				})
			}

			// Per-email exponential backoff on outbound mails — bound the spam
			// pressure on a real user even if attackers spray the endpoint.
			// Reuses login_* backoff config against person_auth_log.
			const retryAfter = await db.queryHandler.fetch(
				new NextMailAttemptQuery(email, 'passwordless_login_init', 'passwordless_login'),
			)
			if (retryAfter > 0) {
				const retryAfterSeconds = Math.max(1, retryAfter)
				return new ResponseError(
					'RATE_LIMIT_EXCEEDED',
					`Too many passwordless sign-in requests for this email. Retry after ${retryAfterSeconds}s.`,
					{
						[AuthLogService.Key]: new AuthLogService.Bag({
							personInput: email,
							personId: person.id,
						}),
					},
				)
			}

			const createTokenCommand = CreatePersonTokenCommand.createPasswordlessRequest(
				person.id,
				intervalToSeconds(configuration.passwordless.expiration) / 60,
			)
			const result = await db.commandBus.execute(createTokenCommand)

			const url = this.formatUrl(configuration.passwordless.url ?? null, result.token, result.id, email) ?? undefined

			const projects = await this.projectManager.getProjectsByIdentity(db, person.identity_id, permissionContext)
			const project = getPreferredProject(projects, mailProject ?? null)

			await this.mailer.sendPasswordlessEmail(db, person, {
				token: result.token,
				url,
				project: project?.name,
				projectSlug: project?.slug,
				requestId: result.id,
			}, {
				variant: mailVariant || '',
				projectId: project?.id ?? null,
				recipientIdentityId: person.identity_id,
			})

			return new ResponseOk({
				requestId: result.id,
				expiresAt: result.expiresAt,
				person,
				[AuthLogService.Key]: new AuthLogService.Bag({
					personInput: email,
					personId: person.id,
					tokenId: result.id,
				}),
			})
		})
	}

	private formatUrl(url: string | null, token: string, requestId: string, email: string): string | null {
		if (!url) {
			return null
		}
		const urlObj = new URL(url)
		urlObj.searchParams.set('token', token)
		urlObj.searchParams.set('request_id', requestId)
		urlObj.searchParams.set('email', email)
		return urlObj.toString()
	}

	async signInPasswordless({ db, expiration, token, requestId, mfaOtp, backupCode, validationType, requestInfo, trustForwardedInfo }: {
		db: DatabaseContext
		validationType: PersonToken.ValidationType
		requestId: string
		token: string
		mfaOtp?: string
		backupCode?: string
		expiration?: number
		requestInfo?: ApiKeyRequestInfo
		trustForwardedInfo?: boolean
	}): Promise<PasswordlessSignInManager.SignInPasswordlessResponse> {
		// Every request that checks a guessable code (the e-mailed OTP, a TOTP or a backup code) reserves one attempt
		// on the token first. The claim runs outside the sign-in transaction, so it is counted even when that
		// transaction fails, and its conditional UPDATE keeps parallel guesses within the limit. With a magic link,
		// only a request carrying the valid link token may spend an attempt.
		let claimed = false
		if (validationType === 'otp' || mfaOtp !== undefined || backupCode !== undefined) {
			const claimTarget = await db.queryHandler.fetch(PersonTokenQuery.byId(requestId, 'passwordless'))
			const mayClaim = claimTarget !== null && (validationType === 'otp' || validateToken({ entry: claimTarget, token, validationType }).ok)
			if (mayClaim) {
				claimed = await db.commandBus.execute(new ClaimOtpAttemptCommand(claimTarget.id, MAX_OTP_ATTEMPTS))
				if (!claimed) {
					return new ResponseError(
						claimTarget.used_at ? 'TOKEN_USED' : 'TOKEN_EXPIRED',
						claimTarget.used_at ? 'Token used' : 'OTP attempts exceeded',
						{
							[AuthLogService.Key]: new AuthLogService.Bag({
								personId: claimTarget.person_id,
								tokenId: claimTarget.id,
							}),
						},
					)
				}
			}
		}
		const result = await this.verifyAndSignIn({ db, expiration, token, requestId, mfaOtp, backupCode, validationType, requestInfo, trustForwardedInfo })
		if (claimed && !result.ok) {
			if (result.error === 'TOKEN_INVALID' || result.error === 'INVALID_OTP_TOKEN') {
				await db.commandBus.execute(new ExpireExhaustedOtpTokenCommand(requestId, MAX_OTP_ATTEMPTS))
			} else {
				// Not a wrong code (e.g. a right e-mailed code answered OTP_REQUIRED), so it does not count.
				await db.commandBus.execute(new ReleaseOtpAttemptCommand(requestId))
			}
		}
		return result
	}

	private async verifyAndSignIn({ db, expiration, token, requestId, mfaOtp, backupCode, validationType, requestInfo, trustForwardedInfo }: {
		db: DatabaseContext
		validationType: PersonToken.ValidationType
		requestId: string
		token: string
		mfaOtp?: string
		backupCode?: string
		expiration?: number
		requestInfo?: ApiKeyRequestInfo
		trustForwardedInfo?: boolean
	}): Promise<PasswordlessSignInManager.SignInPasswordlessResponse> {
		return db.transaction(async (db): Promise<PasswordlessSignInManager.SignInPasswordlessResponse> => {
			const tokenResult = await db.queryHandler.fetch(PersonTokenQuery.byId(requestId, 'passwordless'))
			const tokenValidationResult = validateToken({
				entry: tokenResult,
				token,
				validationType,
			})
			if (!tokenValidationResult.ok) {
				return new ResponseError(tokenValidationResult.error, tokenValidationResult.errorMessage, {
					...tokenValidationResult.metadata ?? {},
					[AuthLogService.Key]: new AuthLogService.Bag({
						personId: tokenResult?.person_id,
						tokenId: tokenResult?.id,
					}),
				})
			}
			if (!tokenResult) {
				throw new ImplementationException()
			}
			const personRow = await db.queryHandler.fetch(PersonQuery.byId(tokenValidationResult.result.person_id))
			if (!personRow) {
				throw new ImplementationException()
			}
			if (personRow.disabled_at !== null) {
				return new ResponseError('PERSON_DISABLED', `Person is disabled`, {
					[AuthLogService.Key]: new AuthLogService.Bag({
						personId: personRow.id,
						tokenId: tokenResult?.id,
					}),
				})
			}

			// Re-checked here and not only at init: a link created while this magic link
			// was in flight would otherwise still mint a locally authenticated session.
			const exclusiveIdps = await db.queryHandler.fetch(new LocalAuthDisablingIdpsQuery(personRow.id))
			if (exclusiveIdps.length > 0) {
				return new ResponseError('IDP_REQUIRED', `Sign in using ${exclusiveIdps.join(' or ')}`, {
					[AuthLogService.Key]: new AuthLogService.Bag({
						personId: personRow.id,
						tokenId: tokenResult?.id,
					}),
				})
			}

			let usedBackupCode = false
			if (personRow.otp_secret && personRow.otp_activated_at) {
				if (mfaOtp) {
					if (!await this.otpManager.verifyOtp(db, personRow, mfaOtp)) {
						return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', {
							[AuthLogService.Key]: new AuthLogService.Bag({
								personId: personRow.id,
								tokenId: tokenResult?.id,
							}),
						})
					}
				} else if (backupCode) {
					if (!await this.backupCodeManager.verifyAndConsume(db, personRow, backupCode)) {
						return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', {
							[AuthLogService.Key]: new AuthLogService.Bag({
								personId: personRow.id,
								tokenId: tokenResult?.id,
							}),
						})
					}
					usedBackupCode = true
				} else {
					return new ResponseError('OTP_REQUIRED', `2FA is enabled. OTP token is required`, {
						[AuthLogService.Key]: new AuthLogService.Bag({
							personId: personRow.id,
							tokenId: tokenResult?.id,
						}),
					})
				}
			}
			// NOTE: passwordless sign-in does NOT enforce mandatory-MFA enrollment.
			// A person with no MFA factor is let through even when an auth_policy would
			// require MFA — enroll-via-sign-in is password-only, and passwordless email
			// access is itself a possession factor. An existing factor (TOTP/backup
			// code, handled above) is still verified. Documented limitation (A06).

			await db.commandBus.execute(new InvalidateTokenCommand(tokenValidationResult.result.id))
			// Receiving and clicking the magic link proves ownership of the address,
			// so a successful passwordless sign-in also satisfies the e-mail
			// verification requirement. Without this, a required-but-unverified
			// account could obtain a session here while being blocked from password
			// sign-in (SignInManager) — an inconsistent, exploitable gap.
			const emailVerifiedNow = personRow.email_verified_at === null
			if (emailVerifiedNow) {
				await db.commandBus.execute(new MarkEmailVerifiedCommand(personRow.id))
			}
			const sessionToken = await this.apiKeyManager.createSessionApiKey(db, personRow.identity_id, expiration, requestInfo, trustForwardedInfo)

			return new ResponseOk({
				person: personRow,
				token: sessionToken,
				usedBackupCode,
				[AuthLogService.Key]: new AuthLogService.Bag({
					personId: personRow.id,
					tokenId: tokenResult?.id,
					// Record that this sign-in also satisfied e-mail verification, so
					// the audit trail shows when/how the address became verified.
					eventData: emailVerifiedNow ? { emailVerified: true } : undefined,
				}),
			})
		})
	}

	async activatePasswordlessOtp({ db, token, requestId, otpHash }: {
		db: DatabaseContext
		requestId: string
		token: string
		otpHash: string
	}): Promise<PasswordlessSignInManager.ActivatePasswordlessOtpResponse> {
		return db.transaction(async (db): Promise<PasswordlessSignInManager.ActivatePasswordlessOtpResponse> => {
			const tokenResult = await db.queryHandler.fetch(PersonTokenQuery.byId(requestId, 'passwordless'))
			const tokenValidationResult = validateToken({
				entry: tokenResult,
				token,
				validationType: 'token',
			})
			if (!tokenValidationResult.ok) {
				return new ResponseError(tokenValidationResult.error, tokenValidationResult.errorMessage, {
					...tokenValidationResult.metadata ?? {},
					[AuthLogService.Key]: new AuthLogService.Bag({
						personId: tokenResult?.person_id,
						tokenId: tokenResult?.id,
					}),
				})
			}

			await db.commandBus.execute(new ActivateOtpCommand(tokenValidationResult.result.id, otpHash))

			return new ResponseOk({
				person: tokenResult?.person_id,
				[AuthLogService.Key]: new AuthLogService.Bag({
					personId: tokenResult?.person_id,
					tokenId: tokenResult?.id,
				}),
			})
		})
	}
}

namespace PasswordlessSignInManager {
	export type InitSignInPasswordlessResponse = Response<
		InitSignInPasswordlessResult & {
			[AuthLogService.Key]: AuthLogService.Bag
		},
		InitSignInPasswordlessErrorCode,
		{
			[AuthLogService.Key]: AuthLogService.Bag
		}
	>

	interface SignInPasswordlessResult {
		readonly person: PersonRow
		readonly token: string
		/** True when MFA was satisfied by consuming a backup code (instead of a TOTP token). */
		readonly usedBackupCode?: boolean
		[AuthLogService.Key]: AuthLogService.Bag
	}
	export type SignInPasswordlessResponse = Response<SignInPasswordlessResult, SignInPasswordlessErrorCode, {
		[AuthLogService.Key]: AuthLogService.Bag
	}>

	export type ActivatePasswordlessOtpResponse = Response<
		{
			[AuthLogService.Key]: AuthLogService.Bag
		},
		ActivatePasswordlessOtpErrorCode,
		{
			[AuthLogService.Key]: AuthLogService.Bag
		}
	>
}

export { PasswordlessSignInManager }
