import { Literal, SelectBuilder } from '@contember/database'
import { DatabaseContext } from "../utils/index.js"
import { Providers } from "../providers.js"
import { ConsumeBackupCodeCommand, CreateBackupCodeCommand, DeleteBackupCodesCommand } from "../commands/index.js"
import { computeTokenHash } from "../utils/token.js"
import { UserMailer } from "../mailing/index.js"
import { PersonRow } from "../queries/index.js"

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
		private readonly mailer: UserMailer,
		private readonly providers: Pick<Providers, 'uuid' | 'now' | 'randomBytes'>,
	) {}

	/**
	 * Replaces the whole set: deletes any existing codes for the person, issues
	 * {@link BACKUP_CODE_COUNT} fresh ones, stores their hashes and returns the
	 * formatted plaintext codes (to be shown once).
	 */
	async generate(dbContext: DatabaseContext, personId: string): Promise<string[]> {
		const codes: string[] = []
		for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
			codes.push(await this.generateCode())
		}
		// Replace the whole set atomically: a mid-flow failure must never leave the
		// person with a partial set that doesn't match the plaintext codes returned
		// to (and shown once to) the caller.
		await dbContext.transaction(async tx => {
			await tx.commandBus.execute(new DeleteBackupCodesCommand(personId))
			for (const code of codes) {
				// Hash the normalized form so verification (which normalizes its input) matches.
				await tx.commandBus.execute(new CreateBackupCodeCommand(personId, this.hash(this.normalize(code))))
			}
		})
		return codes
	}

	/**
	 * Normalizes the supplied code, then atomically consumes a single unused
	 * matching code. Returns whether a code was actually consumed. Safe against
	 * double-spend (see {@link ConsumeBackupCodeCommand}).
	 */
	async verifyAndConsume(dbContext: DatabaseContext, person: PersonRow, code: string): Promise<boolean> {
		const normalized = this.normalize(code)
		if (normalized.length === 0) {
			return false
		}
		const consumed = await dbContext.commandBus.execute(new ConsumeBackupCodeCommand(person.id, this.hash(normalized)))
		if (consumed && (await this.countUnused(dbContext, person.id)) === 0) {
			// Best-effort: notify the person they have no backup codes left. A failed
			// email must never block or fail sign-in, so swallow any error.
			try {
				await this.mailer.sendBackupCodesExhaustedEmail(dbContext, { email: person.email ?? '' }, { projectId: null, variant: '' })
			} catch {
				// ignore
			}
		}
		return consumed
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
