import { DatabaseQuery, DatabaseQueryable, Operator } from '@contember/database'
import { PersonListRow } from './types.js'
import { PersonQueryBuilderFactory } from './PersonQueryBuilderFactory.js'

export interface PersonsQueryFilter {
	readonly email?: string | null
	readonly personId?: string | null
	readonly identityId?: string | null
	/**
	 * When set, restricts the result to persons with one of these identity ids.
	 * Used to scope the listing for non-SUPER_ADMIN callers to exactly the members
	 * they may see (resolved via the same per-role filtering as `project.members`).
	 * An empty array therefore matches nobody — callers should short-circuit
	 * instead of issuing the query.
	 */
	readonly identityIds?: readonly string[]
}

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 1000

export class PersonsQuery extends DatabaseQuery<PersonListRow[]> {
	constructor(
		private readonly filter: PersonsQueryFilter = {},
		private readonly limit?: number | null,
		private readonly offset?: number | null,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<PersonListRow[]> {
		const { email, personId, identityId, identityIds } = this.filter
		// Cap server-side so an unbounded/negative `limit` can't dump the whole
		// person table; mirrors the AuthLogQuery convention.
		const limit = Math.min(Math.max(this.limit ?? DEFAULT_LIMIT, 0), MAX_LIMIT)
		const offset = Math.max(this.offset ?? 0, 0)
		return await PersonQueryBuilderFactory.createPersonListQueryBuilder()
			.match(qb => (email ? qb.where(it => it.compare(['person', 'email'], Operator.containsCI, email)) : qb))
			.match(qb => (personId ? qb.where(it => it.compare(['person', 'id'], Operator.eq, personId)) : qb))
			.match(qb => (identityId ? qb.where(it => it.compare(['person', 'identity_id'], Operator.eq, identityId)) : qb))
			.match(qb => (identityIds ? qb.where(it => it.in(['person', 'identity_id'], [...identityIds])) : qb))
			.orderBy(['person', 'email'])
			.limit(limit, offset)
			.getResult(db)
	}

	static get defaultLimit(): number {
		return DEFAULT_LIMIT
	}

	static get maxLimit(): number {
		return MAX_LIMIT
	}
}
