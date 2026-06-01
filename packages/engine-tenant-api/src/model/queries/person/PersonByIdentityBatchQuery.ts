import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { PersonRow } from './types.js'
import { PersonQueryBuilderFactory } from './PersonQueryBuilderFactory.js'

export class PersonByIdentityBatchQuery extends DatabaseQuery<PersonRow[]> {
	constructor(private identityIds: string[]) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<PersonRow[]> {
		const rows = await PersonQueryBuilderFactory.createPersonQueryBuilder()
			.where(expr => expr.in(['person', 'identity_id'], this.identityIds))
			.getResult(db)

		return rows
	}
}
