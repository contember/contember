import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'

/**
 * Atomically consumes an unused backup code matching the given hash.
 * Returns true if a code was consumed. Safe against double-spend: the
 * UPDATE only touches a row that is still unused, and we rely on the
 * affected-row count, so two concurrent attempts with the same code can
 * succeed at most once.
 */
export class ConsumeBackupCodeCommand implements Command<boolean> {
	constructor(
		private readonly personId: string,
		private readonly codeHash: string,
	) {}

	async execute({ db, providers }: Command.Args): Promise<boolean> {
		const affected = await UpdateBuilder.create()
			.table('person_backup_code')
			.values({
				used_at: providers.now(),
			})
			.where({
				person_id: this.personId,
				code_hash: this.codeHash,
			})
			.where(expr => expr.isNull('used_at'))
			.execute(db)

		return affected > 0
	}
}
