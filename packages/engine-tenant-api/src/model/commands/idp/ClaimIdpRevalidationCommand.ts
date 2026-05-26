import { Command } from '../Command'

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
		const result = await db.query(
			`UPDATE "idp_session"
			 SET "last_validated_at" = now()
			 WHERE "id" = ? AND "last_validated_at" <= now() - ?::interval`,
			[this.id, this.interval],
		)
		return (result.rowCount ?? 0) > 0
	}
}
