import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { PersonToken } from '../../type'
import { computeTokenHash } from '../../utils'

export class PersonTokenQuery extends DatabaseQuery<PersonToken.Row | null> {

	private constructor(
		private readonly identifierType: 'id' | 'token_hash',
		private readonly identifier: string,
		private readonly type: PersonToken.Type,
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

	async fetch({ db }: DatabaseQueryable): Promise<PersonToken.Row | null> {
		const result = await SelectBuilder.create<PersonToken.Row>()
			.from('person_token')
			.select(new Literal('*'))
			.where({
				[this.identifierType]: this.identifier,
				type: this.type,
			})
			.getResult(db)
		return this.fetchOneOrNull(result)
	}
}
