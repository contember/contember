import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import ApiKey from '../type/ApiKey'

class ApiKeyByTokenQuery extends KnexQuery<ApiKeyByTokenQuery.Result> {
	constructor(private readonly token: string) {
		super()
	}

	async fetch(queryable: KnexQueryable): Promise<ApiKeyByTokenQuery.Result> {
		const tokenHash = ApiKey.computeTokenHash(this.token)
		const rows = await queryable
			.createQueryBuilder()
			.select(
				'tenant.api_key.id',
				'tenant.api_key.type',
				'tenant.api_key.identity_id',
				'tenant.api_key.enabled',
				'tenant.api_key.expires_at',
				'tenant.identity.roles',
				'tenant.api_key.expiration'
			)
			.from('tenant.api_key')
			.innerJoin('tenant.identity', 'tenant.api_key.identity_id', 'tenant.identity.id')
			.where('token_hash', tokenHash)

		return this.fetchOneOrNull(rows)
	}
}

namespace ApiKeyByTokenQuery {
	export type Result = null | {
		readonly id: string
		readonly type: ApiKey.Type
		readonly identity_id: string
		readonly enabled: boolean
		readonly expires_at: Date
		readonly expiration: number | null
		readonly roles: string[]
	}
}

export default ApiKeyByTokenQuery
