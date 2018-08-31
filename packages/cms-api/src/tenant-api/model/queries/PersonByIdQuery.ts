import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'

class PersonByIdQuery extends KnexQuery<PersonByIdQuery.Result> {
	constructor(private readonly personId: string) {
		super()
	}

	async fetch(queryable: KnexQueryable): Promise<PersonByIdQuery.Result> {
		const rows = await queryable
			.createQueryBuilder()
			.select('id', 'email')
			.from('tenant.person')
			.where('id', this.personId)

		return this.fetchOneOrNull(rows)
	}
}

namespace PersonByIdQuery {
	export type Result = null | {
		readonly id: string
		readonly email: string
	}
}

export default PersonByIdQuery
