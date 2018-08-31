import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'

class PersonByIdentityQuery extends KnexQuery<PersonByIdentityQuery.Result> {
	constructor(private readonly identityId: string) {
		super()
	}

	async fetch(queryable: KnexQueryable): Promise<PersonByIdentityQuery.Result> {
		const rows = await queryable
			.createQueryBuilder()
			.select('id', 'email')
			.from('tenant.person')
			.where('identity_id', this.identityId)

		return this.fetchOneOrNull(rows)
	}
}

namespace PersonByIdentityQuery {
	export type Result = null | {
		readonly id: string
		readonly email: string
	}
}

export default PersonByIdentityQuery
