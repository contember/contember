import DbQuery from '../../../core/database/DbQuery'
import DbQueryable from '../../../core/database/DbQueryable'

class PersonByEmailQuery extends DbQuery<PersonByEmailQuery.Result> {
	constructor(private readonly email: string) {
		super()
	}

	async fetch(queryable: DbQueryable): Promise<PersonByEmailQuery.Result> {
		const rows = await queryable
			.createSelectBuilder<PersonByEmailQuery.Row>()
			.select('id')
			.select('password_hash')
			.select('identity_id')
			.from('person')
			.where({
				email: this.email,
			})
			.getResult()

		return this.fetchOneOrNull(rows)
	}
}

namespace PersonByEmailQuery {
	export type Row = {
		readonly id: string
		readonly password_hash: string
		readonly identity_id: string
	}
	export type Result = null | Row
}

export default PersonByEmailQuery
