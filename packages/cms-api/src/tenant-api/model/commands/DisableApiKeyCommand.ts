import Command from './Command'
import Client from '../../../core/database/Client'

class DisableApiKeyCommand implements Command<boolean> {
	constructor(private readonly apiKeyId: string) {}

	async execute(db: Client): Promise<boolean> {
		const qb = db
			.updateBuilder()
			.table('api_key')
			.where({
				id: this.apiKeyId,
			})
			.values({ disabled_at: new Date() })

		return (await qb.execute()) > 0
	}
}

export default DisableApiKeyCommand
