import Command from './Command'
import Client from '../../../core/database/Client'

class DisableApiKeyCommand implements Command<void> {
	constructor(private readonly apiKeyId: string) {
	}

	async execute(db: Client): Promise<void> {
		const qb = db
			.updateBuilder()
			.table('api_key')
			.where({
				id: this.apiKeyId,
			})
			.values({ disabled_at: new Date() })

		await qb.execute()
	}
}

export default DisableApiKeyCommand
