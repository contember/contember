import { PersonRow } from '../queries/index.js'
import { ConfirmOtpCommand, DisableOtpCommand, PrepareOtpCommand } from '../commands/index.js'
import { DatabaseContext } from '../utils/index.js'
import { OtpAuthenticator, OtpData } from './OtpAuthenticator.js'
import { Providers } from '../providers.js'

type SecretLike = { uri: string } | { secret: string }

export class OtpManager {
	constructor(
		private readonly otpAuthenticator: OtpAuthenticator,
		private readonly providers: Pick<Providers, 'decrypt'>,
	) {}

	async prepareOtp(dbContext: DatabaseContext, person: PersonRow, label: string): Promise<OtpData> {
		const otp = await this.otpAuthenticator.create(person.email ?? person.name ?? 'unnamed', label)
		await dbContext.commandBus.execute(new PrepareOtpCommand(person.id, otp.secret))
		return otp
	}

	async confirmOtp(dbContext: DatabaseContext, person: PersonRow): Promise<void> {
		await dbContext.commandBus.execute(new ConfirmOtpCommand(person.id))
	}

	async disableOtp(dbContext: DatabaseContext, person: PersonRow): Promise<void> {
		await dbContext.commandBus.execute(new DisableOtpCommand(person.id))
	}

	/** Verifies a token against the person's *active* TOTP secret. */
	async verifyOtp(person: PersonRow, token: string): Promise<boolean> {
		const secretLike = await this.resolveSecret(person.otp_secret, person.otp_secret_version)
		return this.otpAuthenticator.validate(secretLike, token)
	}

	/** Verifies a token against the person's *pending* TOTP secret (used during enrollment). */
	async verifyPendingOtp(person: PersonRow, token: string): Promise<boolean> {
		const secretLike = await this.resolveSecret(person.otp_pending_secret, person.otp_pending_version)
		return this.otpAuthenticator.validate(secretLike, token)
	}

	/**
	 * Resolves the stored secret bytes into a SecretLike the authenticator understands.
	 * Version 0 = legacy plaintext otpauth URI. Version >= 1 = encrypted base32 secret.
	 */
	private async resolveSecret(secret: Buffer | null, version: number | null): Promise<SecretLike> {
		if (!secret || version === null) {
			throw new OtpError('not configured')
		}
		if (version === 0) {
			return { uri: secret.toString('utf8') }
		}
		const decrypted = await this.providers.decrypt(secret, version)
		// TODO: opportunistic re-encryption of version-0 secrets on successful verify.
		return { secret: decrypted.value.toString('utf8') }
	}
}

export class OtpError extends Error {
}
