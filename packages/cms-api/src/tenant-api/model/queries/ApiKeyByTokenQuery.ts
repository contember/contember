import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import ApiKey from '../type/ApiKey'

class ApiKeyByTokenQuery extends KnexQuery<ApiKeyByTokenQuery.Result> {
  constructor(private readonly token: string) {
    super();
  }

  async fetch(queryable: KnexQueryable): Promise<ApiKeyByTokenQuery.Result> {
    const tokenHash = ApiKey.computeTokenHash(this.token)
    const rows = await queryable.createQueryBuilder()
      .select('id', 'type', 'identity_id', 'enabled', 'expires_at')
      .from('tenant.api_key')
      .where('token_hash', tokenHash)

    return this.fetchOneOrNull(rows)
  }
}

namespace ApiKeyByTokenQuery {
  export type Result = null|{
    readonly id: string
    readonly type: ApiKey.Type
    readonly identity_id: string
    readonly enabled: boolean
    readonly expires_at: Date
  }
}

export default ApiKeyByTokenQuery
