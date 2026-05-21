import { Literal, SelectBuilder } from '@contember/database'
import { DatabaseContext } from '../utils'
import { Providers } from '../providers'
import { ConsumeBackupCodeCommand, CreateBackupCodeCommand, DeleteBackupCodesCommand } from '../commands'
import { computeTokenHash } from '../utils/token'

/** Number of backup codes issued per generation. */
const BACKUP_CODE_COUNT = 10
/** Number of significant characters per backup code (before formatting). */
const BACKUP_CODE_LENGTH = 10
/**
 * Unambiguous lowercase alphabet, without the easily confused characters
 * 0/1/l/o. 32 symbols (base32-style).
 */
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

/**
 * Manages MFA backup/recovery codes (the `person_backup_code` table).
 *
 * Codes only exist for a person who has enrolled TOTP. Behavior for everyone
 * else is unchanged. Plaintext codes are shown exactly once (on generation);
 * only their sha256 hashes are stored.
 */
export class BackupCodeManager {
	constructor(
		private readonly providers: Pick<Providers, 'uuid' | 'now' | 'randomBytes'>,
	) {}

	/**
	 * Replaces the whole set: deletes any existing codes for the person, issues
	 * {@link BACKUP_CODE_COUNT} fresh ones, stores their hashes and returns the
	 * formatted plaintext codes (to be shown once).
	 */
	async generate(dbContext: DatabaseContext, personId: string): Promise<string[]> {
		await dbContext.commandBus.execute(new DeleteBackupCodesCommand(personId))

		const codes: string[] = []
		for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
			const code = await this.generateCode()
			codes.push(code)
			// Hash the normalized form so verification (which normalizes its input) matches.
			await dbContext.commandBus.execute(new CreateBackupCodeCommand(personId, this.hash(this.normalize(code))))
		}
		return codes
	}

	/**
	 * Normalizes the supplied code, then atomically consumes a single unused
	 * matching code. Returns whether a code was actually consumed. Safe against
	 * double-spend (see {@link ConsumeBackupCodeCommand}).
	 */
	async verifyAndConsume(dbContext: DatabaseContext, personId: string, code: string): Promise<boolean> {
		const normalized = this.normalize(code)
		if (normalized.length === 0) {
			return false
		}
		// TODO(A07-followup): when this consumes the *last* unused code, send an
		// email notification ("you have no backup codes left"). Needs a new mail
		// template + a default-template migration, so it is intentionally deferred.
		return dbContext.commandBus.execute(new ConsumeBackupCodeCommand(personId, this.hash(normalized)))
	}

	async deleteForPerson(dbContext: DatabaseContext, personId: string): Promise<void> {
		await dbContext.commandBus.execute(new DeleteBackupCodesCommand(personId))
	}

	/** Number of still-usable backup codes for the person. */
	async countUnused(dbContext: DatabaseContext, personId: string): Promise<number> {
		const rows = await SelectBuilder.create<{ count: string }>()
			.from('person_backup_code')
			.select(new Literal('count(*)::text as count'))
			.where({ person_id: personId })
			.where(expr => expr.isNull('used_at'))
			.getResult(dbContext.client)
		return Number(rows[0]?.count ?? '0')
	}

	/** Strips formatting (hyphens/whitespace) and lowercases — display formatting must not affect verification. */
	private normalize(code: string): string {
		return code.replace(/[\s-]/g, '').toLowerCase()
	}

	private hash(normalizedCode: string): string {
		return computeTokenHash(normalizedCode)
	}

	private async generateCode(): Promise<string> {
		const bytes = await this.providers.randomBytes(BACKUP_CODE_LENGTH)
		let raw = ''
		for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
			raw += ALPHABET[bytes[i] % ALPHABET.length]
		}
		// Single hyphen in the middle for readability, e.g. "abcde-fghij".
		const mid = Math.floor(BACKUP_CODE_LENGTH / 2)
		return `${raw.slice(0, mid)}-${raw.slice(mid)}`
	}
}
