import Command from './Command'
import ApiKey from '../type/ApiKey'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import ApiKeyHelper from './ApiKeyHelper'

class ProlongApiKey implements Command<void> {
	constructor(private readonly id: string, private readonly type: ApiKey.Type, private readonly expiration?: number) {}

	async execute(db: KnexWrapper): Promise<void> {
		const newExpiration = ApiKeyHelper.getExpiration(this.type, this.expiration)
		if (newExpiration === null) {
			return
		}
		const qb = db
			.updateBuilder()
			.table('api_key')
			.where({ id: this.id })
			.values({
				expires_at: newExpiration,
			})
		await qb.execute()
	}
}

export default ProlongApiKey
