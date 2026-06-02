import { Command } from "../Command.js"
import { InsertBuilder } from '@contember/database'

/**
 * Inserts a single backup code (stored as a hash) for a person.
 */
export class CreateBackupCodeCommand implements Command<void> {
	constructor(
		private readonly personId: string,
		private readonly codeHash: string,
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await InsertBuilder.create()
			.into('person_backup_code')
			.values({
				id: providers.uuid(),
				person_id: this.personId,
				code_hash: this.codeHash,
				created_at: providers.now(),
			})
			.execute(db)
	}
}
