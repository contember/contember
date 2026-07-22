import { Command } from '../Command.js'
import { InsertBuilder } from '@contember/database'

/** Inserts a new `custom_role` row. Returns the generated id. */
export class CreateCustomRoleCommand implements Command<string> {
	constructor(
		private readonly values: {
			slug: string
			description: string | null
			permissions: readonly string[]
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
				permissions: [...this.values.permissions],
				created_at: now,
				updated_at: now,
			})
			.execute(db)
		return id
	}
}
