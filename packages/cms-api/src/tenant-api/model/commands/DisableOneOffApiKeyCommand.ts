import Command from './Command'
import Client from '../../../core/database/Client'
import ApiKey from '../type/ApiKey'

class DisableOneOffApiKeyCommand implements Command<void> {
	constructor(private readonly apiKeyId: string) {}

	async execute(db: Client): Promise<void> {
		const qb = db
			.updateBuilder()
			.table('api_key')
			.where({
				id: this.apiKeyId,
				type: ApiKey.Type.ONE_OFF,
			})
			.values({ enabled: false })

		await qb.execute()
	}
}

export default DisableOneOffApiKeyCommand
