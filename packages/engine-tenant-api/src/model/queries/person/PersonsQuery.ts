import { DatabaseQuery, DatabaseQueryable, Operator } from '@contember/database'
import { PersonRow } from './types.js'
import { PersonQueryBuilderFactory } from './PersonQueryBuilderFactory.js'

export interface PersonsQueryFilter {
	readonly email?: string | null
	readonly personId?: string | null
	readonly identityId?: string | null
	/**
	 * When set, restricts the result to persons who are members of at least one
	 * of these projects. An empty array therefore matches nobody. Used to scope
	 * the listing for non-SUPER_ADMIN callers to projects they may view.
	 */
	readonly memberOfProjectIds?: readonly string[]
}

export class PersonsQuery extends DatabaseQuery<PersonRow[]> {
	constructor(
		private readonly filter: PersonsQueryFilter = {},
		private readonly limit?: number | null,
		private readonly offset?: number | null,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<PersonRow[]> {
		const { email, personId, identityId, memberOfProjectIds } = this.filter
		return await PersonQueryBuilderFactory.createPersonQueryBuilder()
			.match(qb => (email ? qb.where(it => it.compare(['person', 'email'], Operator.containsCI, email)) : qb))
			.match(qb => (personId ? qb.where(it => it.compare(['person', 'id'], Operator.eq, personId)) : qb))
			.match(qb => (identityId ? qb.where(it => it.compare(['person', 'identity_id'], Operator.eq, identityId)) : qb))
			.match(qb =>
				memberOfProjectIds
					? qb.where(it =>
						it.exists(sub =>
							sub
								.from('project_membership')
								.where(expr => expr.columnsEq(['project_membership', 'identity_id'], ['person', 'identity_id']))
								.where(expr => expr.in(['project_membership', 'project_id'], [...memberOfProjectIds]))
						)
					)
					: qb
			)
			.orderBy(['person', 'email'])
			.limit(this.limit ?? undefined, this.offset ?? undefined)
			.getResult(db)
	}
}
