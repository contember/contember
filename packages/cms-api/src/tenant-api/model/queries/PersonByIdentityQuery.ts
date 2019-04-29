import DbQuery from '../../../core/database/DbQuery'
import DbQueryable from '../../../core/database/DbQueryable'

class PersonByIdentityQuery extends DbQuery<PersonByIdentityQuery.Result> {
	constructor(private readonly identityId: string) {
		super()
	}

	async fetch(queryable: DbQueryable): Promise<PersonByIdentityQuery.Result> {
		const rows = await queryable
			.createSelectBuilder<PersonByIdentityQuery.Row>()
			.select('id')
			.select('email')
			.from('person')
			.where({
				identity_id: this.identityId
			})
			.getResult()

		return this.fetchOneOrNull(rows)
	}
}

namespace PersonByIdentityQuery {
	export type Row = {
		readonly id: string
		readonly email: string
	}
	export type Result = null | Row
}

export default PersonByIdentityQuery
