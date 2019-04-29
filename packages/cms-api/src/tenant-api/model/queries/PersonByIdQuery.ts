import DbQuery from '../../../core/knex/DbQuery'
import DbQueryable from '../../../core/knex/DbQueryable'

class PersonByIdQuery extends DbQuery<PersonByIdQuery.Result> {
	constructor(private readonly personId: string) {
		super()
	}

	async fetch(queryable: DbQueryable): Promise<PersonByIdQuery.Result> {
		const rows = await queryable
			.createSelectBuilder<PersonByIdQuery.Row>()
			.select('id')
			.select('email')
			.from('person')
			.where({
				id: this.personId
			})
			.getResult()

		return this.fetchOneOrNull(rows)
	}
}

namespace PersonByIdQuery {
	export type Row = {
		readonly id: string
		readonly email: string
	}
	export type Result = null | Row
}

export default PersonByIdQuery
