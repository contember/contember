import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

/**
 * Atomically claim the right to re-validate a federated session: bump `last_validated_at`
 * to now() iff the throttle window has elapsed. Returns true only to the single request
 * that wins the claim, false to everyone else (still inside the window, or lost the race).
 *
 * This is both the throttle and the single-flight guard — critical for `method: 'refresh'`,
 * where two concurrent revalidations would rotate the refresh token and invalidate each
 * other. The interval is bound as a parameter and cast to `interval`, so it is injection-safe.
 */
export class ClaimIdpRevalidationCommand implements Command<boolean> {
	constructor(
		private readonly id: string,
		private readonly interval: string,
	) {
	}

	async execute({ db }: Command.Args): Promise<boolean> {
		// Both sides of the window read the database clock, never `providers.now()` — the claim must be
		// decided by the same clock that stamps it, or concurrent requests could each think they won.
		const affected = await UpdateBuilder.create()
			.table('idp_session')
			.values({ last_validated_at: expr => expr.raw('now()') })
			.where({ id: this.id })
			.where(expr => expr.raw('"last_validated_at" <= now() - ?::interval', this.interval))
			.execute(db)
		return affected > 0
	}
}
