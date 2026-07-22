import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

/**
 * Updates an existing `custom_role` row. Only the supplied fields are written
 * (an `undefined` field is left untouched; an explicit `null` description clears it).
 * `updated_at` is always bumped. Returns whether a row was affected.
 */
export class UpdateCustomRoleCommand implements Command<boolean> {
	constructor(
		private readonly slug: string,
		private readonly values: {
			description?: string | null
			permissions?: readonly string[]
		},
	) {}

	async execute({ db, providers }: Command.Args): Promise<boolean> {
		const result = await UpdateBuilder.create()
			.table('custom_role')
			.where({ slug: this.slug })
			.values({
				description: this.values.description,
				permissions: this.values.permissions === undefined ? undefined : [...this.values.permissions],
				updated_at: providers.now(),
			})
			.execute(db)
		return result > 0
	}
}
