import { Command } from '../Command'
import { DeleteBuilder } from '@contember/database'

/**
 * Deletes all backup codes (used and unused) for a person.
 */
export class DeleteBackupCodesCommand implements Command<void> {
	constructor(private readonly personId: string) {}

	async execute({ db }: Command.Args): Promise<void> {
		await DeleteBuilder.create()
			.from('person_backup_code')
			.where({ person_id: this.personId })
			.execute(db)
	}
}
