import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { MaybePersonRow } from './types'
import { PersonQueryBuilderFactory } from './PersonQueryBuilderFactory'

class PersonByIdPQuery extends DatabaseQuery<MaybePersonRow> {
	constructor(
		private readonly identityProviderId: string,
		private readonly externalIdentifier: string,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<MaybePersonRow> {
		const rows = await PersonQueryBuilderFactory.createPersonQueryBuilder()
			.join('person_identity_provider', 'idp', it => it.columnsEq(['idp', 'person_id'], ['person', 'id']))
			.where({
				identity_provider_id: this.identityProviderId,
				external_identifier: this.externalIdentifier,
			})
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}

export { PersonByIdPQuery }
