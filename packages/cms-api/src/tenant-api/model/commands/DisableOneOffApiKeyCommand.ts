import Command from './Command'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import ApiKey from '../type/ApiKey'

class DisableOneOffApiKeyCommand implements Command<void> {
	constructor(private readonly apiKeyId: string) {
	}

	async execute(db: KnexWrapper): Promise<void> {
		const qb = db.queryBuilder()
		qb.table('api_key')
		qb.where({
			id: this.apiKeyId,
			type: ApiKey.Type.ONE_OFF,
		})

		await qb.update({ enabled: false })
	}
}

export default DisableOneOffApiKeyCommand
