import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

export class IdentityHasProjectMembershipsQuery extends DatabaseQuery<ReadonlySet<string>> {
	constructor(private readonly identityIds: readonly string[]) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ReadonlySet<string>> {
		const rows = await SelectBuilder.create<{ identity_id: string }>()
			.distinct('identity_id')
			.select('identity_id')
			.from('project_membership')
			.where(expr => expr.in('identity_id', this.identityIds))
			.getResult(db)
		return new Set(rows.map(row => row.identity_id))
	}
}
