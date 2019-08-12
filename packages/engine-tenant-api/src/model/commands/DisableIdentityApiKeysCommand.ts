import { Command } from './'
import { Client } from '@contember/database'

class DisableIdentityApiKeysCommand implements Command<void> {
	constructor(private readonly identityId: string) {}

	async execute(db: Client): Promise<void> {
		const qb = db
			.updateBuilder()
			.table('api_key')
			.where({
				identity_id: this.identityId,
			})
			.values({ disabled_at: new Date() })

		await qb.execute()
	}
}

export { DisableIdentityApiKeysCommand }
