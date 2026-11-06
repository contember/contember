import { Command } from '../Command.js'
import { Operator, UpdateBuilder } from '@contember/database'

/**
 * Records the time-step counter of an accepted TOTP code. Returns false when a code of the same or a later
 * time step was already accepted, so a code cannot be used twice. The conditional UPDATE serializes parallel claims.
 */
export class ClaimTotpCounterCommand implements Command<boolean> {
	constructor(
		private readonly personId: string,
		private readonly counter: number,
	) {}

	async execute({ db }: Command.Args): Promise<boolean> {
		const affected = await UpdateBuilder.create()
			.table('person_mfa')
			.values({
				totp_last_counter: this.counter,
			})
			.where({
				person_id: this.personId,
			})
			.where(expr => expr.or(it => it.isNull('totp_last_counter').compare('totp_last_counter', Operator.lt, this.counter)))
			.execute(db)
		return affected > 0
	}
}
