import { DatabaseQuery } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'
import { MaybePersonRow, PersonRow } from './types'

class PersonQuery extends DatabaseQuery<MaybePersonRow> {
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

	async fetch(queryable: DatabaseQueryable): Promise<MaybePersonRow> {
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

export { PersonQuery }
