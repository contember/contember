import { DatabaseQueryable, DatabaseQuery, SelectBuilder, Operator } from '@contember/database'
import { ApiKey } from '../../type'
import { computeTokenHash } from '../../utils'

class ApiKeyByTokenQuery extends DatabaseQuery<ApiKeyByTokenQuery.Result> {
	constructor(private readonly token: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ApiKeyByTokenQuery.Result> {
		const tokenHash = computeTokenHash(this.token)
		const rows = await SelectBuilder.create<ApiKeyByTokenQuery.Row>()
			.select(['api_key', 'id'])
			.select(['api_key', 'type'])
			.select(['api_key', 'identity_id'])
			.select(['api_key', 'disabled_at'])
			.select(['api_key', 'expires_at'])
			.select(['identity', 'roles'])
			.select(['api_key', 'expiration'])
			.select(['person', 'id'], 'person_id')
			.from('api_key')
			.join('identity', 'identity', joinClause =>
				joinClause.compareColumns(['api_key', 'identity_id'], Operator.eq, ['identity', 'id']),
			)
			.leftJoin('person', 'person', on => on.compareColumns(['person', 'identity_id'], Operator.eq, ['identity', 'id']))
			.where({
				token_hash: tokenHash,
			})
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}

namespace ApiKeyByTokenQuery {
	export type Result = null | Row
	export type Row = {
		readonly id: string
		readonly type: ApiKey.Type
		readonly identity_id: string
		readonly disabled_at: Date | null
		readonly expires_at: Date | null
		readonly expiration: number | null
		readonly roles: string[]
		readonly person_id: string | null
	}
}

export { ApiKeyByTokenQuery }
