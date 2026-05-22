import { PersonRow } from '../queries/index.js'
import { ConfirmOtpCommand, DisableOtpCommand, PrepareOtpCommand, ReEncryptOtpSecretCommand } from '../commands/index.js'
import { DatabaseContext } from '../utils/index.js'
import { OtpAuthenticator, OtpData } from './OtpAuthenticator.js'
import { Providers } from '../providers.js'
import { URI } from 'otpauth'

type SecretLike = { uri: string } | { secret: string }

/**
 * Result of resolving a stored secret: the material the authenticator can
 * validate against, plus (optionally) the base32 secret and the version it was
 * stored under, so a successful verify can opportunistically re-encrypt it.
 */
type ResolvedSecret = {
	secretLike: SecretLike
	/** Set when the active secret should be re-encrypted after a successful verify. */
	reEncrypt?: { oldVersion: number; base32: string }
}

export class OtpManager {
	constructor(
		private readonly otpAuthenticator: OtpAuthenticator,
		private readonly providers: Pick<Providers, 'decrypt' | 'encrypt' | 'encryptionEnabled'>,
	) {}

	async prepareOtp(dbContext: DatabaseContext, person: PersonRow, label: string): Promise<OtpData> {
		const otp = await this.otpAuthenticator.create(person.email ?? person.name ?? 'unnamed', label)
		if (this.providers.encryptionEnabled) {
			// A key is configured: store the base32 secret encrypted (version >= 1).
			const encrypted = await this.providers.encrypt(Buffer.from(otp.secret, 'utf8'))
			await dbContext.commandBus.execute(new PrepareOtpCommand(person.id, encrypted.value, encrypted.version))
		} else {
			// No key: store the plaintext otpauth URI as version 0, exactly like legacy
			// (pre-encryption) secrets. Opportunistic re-encryption upgrades it once a key
			// becomes available.
			await dbContext.commandBus.execute(new PrepareOtpCommand(person.id, Buffer.from(otp.uri, 'utf8'), 0))
		}
		return otp
	}

	async confirmOtp(dbContext: DatabaseContext, person: PersonRow): Promise<void> {
		await dbContext.commandBus.execute(new ConfirmOtpCommand(person.id))
	}

	async disableOtp(dbContext: DatabaseContext, person: PersonRow): Promise<void> {
		await dbContext.commandBus.execute(new DisableOtpCommand(person.id))
	}

	/** Verifies a token against the person's *active* TOTP secret. */
	async verifyOtp(dbContext: DatabaseContext, person: PersonRow, token: string): Promise<boolean> {
		const resolved = await this.resolveSecret(person.otp_secret, person.otp_secret_version)
		const valid = this.otpAuthenticator.validate(resolved.secretLike, token)
		if (valid && resolved.reEncrypt) {
			// Best-effort: re-encryption must never affect the verify result and any
			// failure (encrypt or update) is swallowed so the user still signs in.
			try {
				const { oldVersion, base32 } = resolved.reEncrypt
				const encrypted = await this.providers.encrypt(Buffer.from(base32, 'utf8'))
				await dbContext.commandBus.execute(
					new ReEncryptOtpSecretCommand(person.id, encrypted.value, encrypted.version, oldVersion),
				)
			} catch {
				// ignore — re-encryption is opportunistic
			}
		}
		return valid
	}

	/** Verifies a token against the person's *pending* TOTP secret (used during enrollment). */
	async verifyPendingOtp(person: PersonRow, token: string): Promise<boolean> {
		const resolved = await this.resolveSecret(person.otp_pending_secret, person.otp_pending_version)
		return this.otpAuthenticator.validate(resolved.secretLike, token)
	}

	/**
	 * Resolves the stored secret bytes into something the authenticator understands.
	 * Version 0 = legacy plaintext otpauth URI. Version >= 1 = encrypted base32 secret.
	 *
	 * Also surfaces whether the active secret warrants opportunistic re-encryption:
	 * version-0 (legacy plaintext) always does; version>=1 does when the encryption
	 * layer signals the key has rotated (`needsReEncrypt`).
	 */
	private async resolveSecret(secret: Buffer | null, version: number | null): Promise<ResolvedSecret> {
		if (!secret || version === null) {
			throw new OtpError('not configured')
		}
		if (version === 0) {
			const uri = secret.toString('utf8')
			return {
				secretLike: { uri },
				reEncrypt: { oldVersion: 0, base32: URI.parse(uri).secret.base32 },
			}
		}
		const decrypted = await this.providers.decrypt(secret, version)
		const base32 = decrypted.value.toString('utf8')
		return {
			secretLike: { secret: base32 },
			...(decrypted.needsReEncrypt ? { reEncrypt: { oldVersion: version, base32 } } : {}),
		}
	}
}

export class OtpError extends Error {
}
