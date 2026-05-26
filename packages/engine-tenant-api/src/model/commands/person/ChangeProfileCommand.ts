import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'
import { normalizeEmail } from '../../utils/email.js'

export type ChangeProfileData = {
	readonly email?: string
	readonly name?: string | null
}

export class ChangeProfileCommand implements Command<void> {
	constructor(private readonly personId: string, private readonly data: ChangeProfileData) {}

	async execute({ db }: Command.Args): Promise<void> {
		// Always store the normalized form so the value matches the email_unique
		// index and lookups (PersonQuery.byEmail) regardless of how it was typed.
		const values = this.data.email !== undefined
			? { ...this.data, email: normalizeEmail(this.data.email) }
			: this.data
		await UpdateBuilder.create()
			.table('person')
			.values(values)
			.where({
				id: this.personId,
			})
			.execute(db)
	}
}
