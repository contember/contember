import { DatabaseQuery, DatabaseQueryable, Literal, Operator, SelectBuilderSpecification } from '@contember/database'
import { MaybePersonRow } from './types'
import { PersonQueryBuilderFactory } from './PersonQueryBuilderFactory'
import { normalizeEmail } from '../../utils/email'

export type PersonUniqueIdentifier =
	| { type: 'id'; id: string }
	| { type: 'identity'; id: string }
	| { type: 'email'; email: string }

class PersonQuery extends DatabaseQuery<MaybePersonRow> {
	private constructor(private readonly spec: SelectBuilderSpecification) {
		super()
	}

	static byUniqueIdentifier(identifier: PersonUniqueIdentifier): DatabaseQuery<MaybePersonRow> {
		switch (identifier.type) {
			case 'email':
				return PersonQuery.byEmail(identifier.email)
			case 'id':
				return PersonQuery.byId(identifier.id)
			case 'identity':
				return PersonQuery.byIdentity(identifier.id)
		}
	}

	static byId(id: string): PersonQuery {
		return new PersonQuery(qb => qb.where(it => it.compare(['person', 'id'], Operator.eq, id)))
	}

	static byEmail(email: string): DatabaseQuery<MaybePersonRow> {
		return new PersonByEmailFallbackQuery(email)
	}

	static byExactEmail(email: string): PersonQuery {
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

class PersonByEmailFallbackQuery extends DatabaseQuery<MaybePersonRow> {
	constructor(
		private readonly email: string,
	) {
		super()
	}

	async fetch(ctx: DatabaseQueryable): Promise<MaybePersonRow> {
		const handler = ctx.getHandler()
		const exact = await handler.fetch(PersonQuery.byExactEmail(this.email))
		if (exact) {
			return exact
		}
		const normalizedEmail = normalizeEmail(this.email)
		if (normalizedEmail === this.email) {
			return null
		}
		return await handler.fetch(PersonQuery.byExactEmail(normalizedEmail))
	}

}

export { PersonQuery }
