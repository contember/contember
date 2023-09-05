import { Command } from '../Command'
import { ApiKey } from '../../type'
import { ApiKeyHelper } from './ApiKeyHelper'
import { UpdateBuilder } from '@contember/database'

const PROLONG_THROTTLE_MS = 60_000

export class ProlongApiKeyCommand implements Command<void> {
	constructor(
		private readonly id: string,
		private readonly type: ApiKey.Type,
		private readonly expiration: number | null,
		private readonly currentExpiration: Date | null,
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const newExpiration = ApiKeyHelper.getExpiration(providers, this.type, this.expiration)
		if (newExpiration === null) {
			return
		}

		if (this.currentExpiration) {
			const prolongMs = newExpiration.getTime() - this.currentExpiration.getTime()
			if (prolongMs > 0 && prolongMs < PROLONG_THROTTLE_MS) {
				return
			}
		}

		const qb = UpdateBuilder.create()
			.table('api_key')
			.where({ id: this.id })
			.values({
				expires_at: newExpiration,
			})
		await qb.execute(db)
	}
}
