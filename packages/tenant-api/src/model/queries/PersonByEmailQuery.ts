import KnexQuery from '../../core/knex/KnexQuery'
import KnexQueryable from '../../core/knex/KnexQueryable'

class PersonByEmailQuery extends KnexQuery<PersonByEmailQuery.Result> {
  constructor(private readonly email: string) {
    super();
  }

  async fetch(queryable: KnexQueryable): Promise<PersonByEmailQuery.Result> {
    const rows = await queryable.createQueryBuilder()
      .select('id', 'password_hash', 'identity_id')
      .from('tenant.person')
      .where('email', this.email)

    return this.fetchOneOrNull(rows)
  }
}

namespace PersonByEmailQuery {
  export type Result = null|{
    readonly id: string
    readonly password_hash: string
    readonly identity_id: string
  }
}

export default PersonByEmailQuery
