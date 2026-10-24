import { Literal, UpdateBuilder } from '@contember/database'
import { Command } from '../Command.js'

/** Returns the id of the disabled trust, or `null` when no trust has the slug. */
export class DisableWorkloadTrustCommand implements Command<string | null> {
	constructor(
		private readonly slug: string,
	) {}

	async execute({ db }: Command.Args): Promise<string | null> {
		const rows = await UpdateBuilder.create()
			.table('workload_identity_trust')
			.values({
				// an already disabled trust keeps its original disable time
				disabled_at: new Literal('coalesce("disabled_at", now())'),
				updated_at: new Literal('now()'),
			})
			.where({ slug: this.slug })
			.returning<{ id: string }>('id')
			.execute(db)
		return rows[0]?.id ?? null
	}
}
