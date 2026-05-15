import { InsertBuilder } from '@contember/database'
import { Command } from '../Command'
import { RateLimitScope } from '../../type/RateLimit'

export class RecordRateLimitEventCommand implements Command<void> {
	constructor(
		private readonly scope: RateLimitScope,
		private readonly keyHash: Buffer,
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await InsertBuilder.create()
			.into('rate_limit_event')
			.values({
				id: providers.uuid(),
				scope: this.scope,
				key_hash: this.keyHash,
				occurred_at: providers.now(),
			})
			.execute(db)
	}
}
