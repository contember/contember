import { InsertBuilder } from '@contember/database'
import { Command } from '../Command.js'
import { RateLimitScope } from '../../type/RateLimit.js'

export class RecordRateLimitEventCommand implements Command<void> {
	constructor(
		private readonly scope: RateLimitScope,
		private readonly keyHash: Buffer,
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		// occurred_at is left to its DB default (NOW()) so every rate-limit
		// timestamp is on the database clock — the same clock the window is counted
		// against (see RateLimitCountQuery). Never stamp it from the app clock.
		await InsertBuilder.create()
			.into('rate_limit_event')
			.values({
				id: providers.uuid(),
				scope: this.scope,
				key_hash: this.keyHash,
			})
			.execute(db)
	}
}
