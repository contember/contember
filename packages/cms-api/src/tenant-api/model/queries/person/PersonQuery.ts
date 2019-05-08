import DbQuery from '../../../../core/database/DbQuery'
import DbQueryable from '../../../../core/database/DbQueryable'
import { MaybePersonRow, PersonRow } from './types'

class PersonQuery extends DbQuery<MaybePersonRow> {
	constructor(private readonly condition: { email: string } | { id: string } | { identity_id: string }) {
		super()
	}

	static byId(id: string): PersonQuery {
		return new PersonQuery({ id })
	}

	static byEmail(email: string): PersonQuery {
		return new PersonQuery({ email })
	}

	static byIdentity(identity_id: string): PersonQuery {
		return new PersonQuery({ identity_id })
	}

	async fetch(queryable: DbQueryable): Promise<MaybePersonRow> {
		const rows = await queryable
			.createSelectBuilder<PersonRow>()
			.select('id')
			.select('password_hash')
			.select('identity_id')
			.select('email')
			.from('person')
			.where(this.condition)
			.getResult()

		return this.fetchOneOrNull(rows)
	}
}

export default PersonQuery
