import { Command } from '../Command.js'
import { InsertBuilder } from '@contember/database'

/** Inserts a new `custom_role` row. Returns the generated id. */
export class CreateCustomRoleCommand implements Command<string> {
	constructor(
		private readonly values: {
			slug: string
			description: string | null
			grants: unknown
		},
	) {}

	async execute({ db, providers }: Command.Args): Promise<string> {
		const id = providers.uuid()
		const now = providers.now()
		await InsertBuilder.create()
			.into('custom_role')
			.values({
				id,
				slug: this.values.slug,
				description: this.values.description,
				grants: JSON.stringify(this.values.grants),
				created_at: now,
				updated_at: now,
			})
			.execute(db)
		return id
	}
}
