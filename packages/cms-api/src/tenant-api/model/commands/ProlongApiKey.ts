import Command from './Command'
import ApiKey from '../type/ApiKey'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import ApiKeyHelper from './ApiKeyHelper'

class ProlongApiKey implements Command<void> {
	constructor(private readonly id: string, private readonly type: ApiKey.Type) {}

	async execute(db: KnexWrapper): Promise<void> {
		const newExpiration = ApiKeyHelper.getExpiration(this.type)
		if (newExpiration === null) {
			return
		}
		const qb = db.queryBuilder()
		qb.table('api_key')
		qb.where({ id: this.id })
		await qb.update({
			expires_at: newExpiration,
		})
	}
}

export default ProlongApiKey
