import { DatabaseQuery, DatabaseQueryable, Operator, SelectBuilderSpecification } from '@contember/database'
import { MaybePersonRow } from './types'
import { PersonQueryBuilderFactory } from './PersonQueryBuilderFactory'

class PersonQuery extends DatabaseQuery<MaybePersonRow> {
	private constructor(private readonly spec: SelectBuilderSpecification) {
		super()
	}

	static byId(id: string): PersonQuery {
		return new PersonQuery(qb => qb.where(it => it.compare(['person', 'id'], Operator.eq, id)))
	}

	static byEmail(email: string): PersonQuery {
		return new PersonQuery(qb => qb.where(it => it.compare(['person', 'email'], Operator.eq, email)))
	}

	static byIdentity(identity_id: string): PersonQuery {
		return new PersonQuery(qb => qb.where(it => it.compare(['person', 'identity_id'], Operator.eq, identity_id)))
	}

	async fetch({ db }: DatabaseQueryable): Promise<MaybePersonRow> {
		const rows = await PersonQueryBuilderFactory.createPersonQueryBuilder()
			.match(this.spec)
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}

export { PersonQuery }
