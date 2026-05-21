import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { PersonToken } from '../../type'
import { computeTokenHash } from '../../utils'

export class PersonTokenQuery extends DatabaseQuery<PersonToken.Row | null> {
	private constructor(
		private readonly identifierType: 'id' | 'token_hash' | 'person_id',
		private readonly identifier: string,
		private readonly type: PersonToken.Type,
		private readonly latestUnusedOnly: boolean = false,
	) {
		super()
	}

	public static byId(id: string, type: PersonToken.Type): PersonTokenQuery {
		return new PersonTokenQuery('id', id, type)
	}

	public static byToken(token: string, type: PersonToken.Type): PersonTokenQuery {
		const tokenHash = computeTokenHash(token)
		return new PersonTokenQuery('token_hash', tokenHash, type)
	}

	/** Latest still-unused token of the given type for a person (e.g. the most recent email OTP code). */
	public static latestUnusedByPerson(personId: string, type: PersonToken.Type): PersonTokenQuery {
		return new PersonTokenQuery('person_id', personId, type, true)
	}

	async fetch({ db }: DatabaseQueryable): Promise<PersonToken.Row | null> {
		let qb = SelectBuilder.create<PersonToken.Row>()
			.from('person_token')
			.select(new Literal('*'))
			.where({
				[this.identifierType]: this.identifier,
				type: this.type,
			})
		if (this.latestUnusedOnly) {
			qb = qb
				.where(expr => expr.isNull('used_at'))
				.orderBy('created_at', 'desc')
				.limit(1)
		}
		const result = await qb.getResult(db)
		return this.fetchOneOrNull(result)
	}
}
