import { PersonRow } from '../queries'
import { DatabaseContext, validateToken } from '../utils'
import { Providers } from '../providers'
import { UserMailer } from '../mailing'
import { IncreaseOtpAttemptCommand, InvalidateEmailOtpTokensCommand, InvalidateTokenCommand, SaveEmailOtpTokenCommand } from '../commands'
import { PersonTokenQuery } from '../queries/personToken/PersonTokenQuery'

/** Email-OTP codes are short-lived numeric codes delivered by email. */
const EMAIL_OTP_EXPIRATION_MINUTES = 10
const EMAIL_OTP_DIGITS = 6

/**
 * Email OTP as a second factor (A05). Opt-in per person via
 * `person_mfa.email_otp_enabled`. The emitted code is a 6-digit numeric code,
 * transported through a short-lived `mfa_email_otp` person_token (the code's hash
 * lives in `otp_hash`), validated through the shared `'otp'` token path (max 3
 * attempts). Behavior for anyone who hasn't enabled it is unchanged.
 */
export class EmailOtpManager {
	constructor(
		private readonly mailer: UserMailer,
		private readonly providers: Pick<Providers, 'randomBytes' | 'now' | 'uuid'>,
	) {}

	/**
	 * Generates a fresh code, invalidates any prior unused email-OTP tokens for the
	 * person, persists the new one and emails the code. Must run inside the request's
	 * db context (it issues commands + sends mail).
	 */
	async sendCode(dbContext: DatabaseContext, person: PersonRow): Promise<void> {
		const code = await this.generateCode()
		// Only the latest emailed code may ever verify.
		await dbContext.commandBus.execute(new InvalidateEmailOtpTokensCommand(person.id))
		await dbContext.commandBus.execute(new SaveEmailOtpTokenCommand(person.id, code, EMAIL_OTP_EXPIRATION_MINUTES))
		await this.mailer.sendEmailOtpEmail(dbContext, {
			email: person.email ?? '',
			code,
		}, {
			variant: '',
			projectId: null,
		})
	}

	/**
	 * Fetches the latest unused email-OTP token for the person and validates the
	 * supplied code via the shared `'otp'` path. On an invalid code, bumps the attempt
	 * counter; on success, consumes (invalidates) the token. Returns whether the code
	 * was accepted. Mirrors how PasswordlessSignInManager handles otp validation.
	 */
	async verifyAndConsume(dbContext: DatabaseContext, person: PersonRow, code: string): Promise<boolean> {
		const tokenResult = await dbContext.queryHandler.fetch(PersonTokenQuery.latestUnusedByPerson(person.id, 'mfa_email_otp'))
		const validation = validateToken({
			entry: tokenResult,
			token: code,
			now: this.providers.now(),
			validationType: 'otp',
		})
		if (!validation.ok) {
			if (validation.error === 'TOKEN_INVALID' && tokenResult) {
				await dbContext.commandBus.execute(new IncreaseOtpAttemptCommand(tokenResult.id))
			}
			return false
		}
		await dbContext.commandBus.execute(new InvalidateTokenCommand(validation.result.id))
		return true
	}

	private async generateCode(): Promise<string> {
		// Rejection-free uniform-ish digits is acceptable here: this is a second factor
		// behind a valid password, short-lived, and capped at 3 attempts.
		const bytes = await this.providers.randomBytes(EMAIL_OTP_DIGITS)
		let code = ''
		for (let i = 0; i < EMAIL_OTP_DIGITS; i++) {
			code += (bytes[i] % 10).toString()
		}
		return code
	}
}
