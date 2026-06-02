import { PersonRow } from '../queries/index.js'
import { DatabaseContext, MAX_OTP_ATTEMPTS, validateToken } from '../utils/index.js'
import { Providers } from '../providers.js'
import { UserMailer } from '../mailing/index.js'
import { ClaimOtpAttemptCommand, InvalidateEmailOtpTokensCommand, InvalidateTokenCommand, SaveEmailOtpTokenCommand } from '../commands/index.js'
import { PersonTokenQuery } from '../queries/personToken/PersonTokenQuery.js'
import { RateLimitDecision, RateLimiter } from './RateLimiter.js'
import { RateLimitScopes } from '../type/RateLimit.js'
import { Config } from '../type/Config.js'

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
		private readonly rateLimiter: RateLimiter,
	) {}

	/**
	 * Generates a fresh code, invalidates any prior unused email-OTP tokens for the
	 * person, persists the new one and emails the code. Must run inside the request's
	 * db context (it issues commands + sends mail).
	 *
	 * Gated by the per-person `email_otp_per_person` rate limit so an attacker who
	 * knows the password cannot re-issue codes to reset the per-code 3-attempt
	 * counter, nor email-bomb a person. When the limit is hit nothing is sent and
	 * the returned decision is `ok: false` (the caller decides how to surface it);
	 * a previously emailed, still-valid code remains usable.
	 */
	async sendCode(dbContext: DatabaseContext, person: PersonRow, config: Config): Promise<RateLimitDecision> {
		const decision = await this.rateLimiter.consume(dbContext, RateLimitScopes.emailOtpPerPerson, person.id, config)
		if (!decision.ok) {
			return decision
		}
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
		return decision
	}

	/**
	 * Fetches the latest unused email-OTP token for the person and validates the
	 * supplied code via the shared `'otp'` path; on success, consumes (invalidates)
	 * the token. Returns whether the code was accepted.
	 *
	 * The per-code attempt budget is reserved up front via {@link ClaimOtpAttemptCommand}
	 * — a single conditional UPDATE that increments `otp_attempts` only while it is
	 * still below {@link MAX_OTP_ATTEMPTS}. Because that UPDATE serializes concurrent
	 * writers on the row, N parallel guesses can never collectively exceed the cap;
	 * a plain read-then-increment let them all pass with a stale counter.
	 */
	async verifyAndConsume(dbContext: DatabaseContext, person: PersonRow, code: string): Promise<boolean> {
		const tokenResult = await dbContext.queryHandler.fetch(PersonTokenQuery.latestUnusedByPerson(person.id, 'mfa_email_otp'))
		if (!tokenResult) {
			return false
		}
		// Atomically reserve a guess slot before comparing the code. A false result
		// means the token was already used/replaced or the attempt cap is exhausted.
		const reserved = await dbContext.commandBus.execute(new ClaimOtpAttemptCommand(tokenResult.id, MAX_OTP_ATTEMPTS))
		if (!reserved) {
			return false
		}
		// otp_hash and expires_at are immutable for a token, so validating against the
		// pre-claim snapshot is correct; the attempt has already been counted.
		const validation = validateToken({
			entry: tokenResult,
			token: code,
			now: this.providers.now(),
			validationType: 'otp',
		})
		if (!validation.ok) {
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
