import Command from './Command'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import ApiKey from '../type/ApiKey'

class DisableOneOffApiKeyCommand implements Command<void> {
	constructor(private readonly apiKeyId: string) {}

	async execute(db: KnexWrapper): Promise<void> {
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
