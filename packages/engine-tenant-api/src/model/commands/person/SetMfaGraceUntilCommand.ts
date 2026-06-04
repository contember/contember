import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

/** Sets `person.mfa_grace_until` (the anchor for the MFA enrollment grace window). */
export class SetMfaGraceUntilCommand implements Command<void> {
	constructor(private readonly personId: string, private readonly graceUntil: Date) {}

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person')
			.where({ id: this.personId })
			.values({
				mfa_grace_until: this.graceUntil,
			})
			.execute(db)
	}
}
