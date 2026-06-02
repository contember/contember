import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { AuthPolicyRow } from "../../type/index.js"

/**
 * Lists `auth_policy` rows. Optionally filters to a single project (or to the
 * global scope when `projectId` is explicitly `null`); with no filter, returns
 * every row. Intervals are returned as IPostgresInterval, like ConfigRow.
 */
export class AuthPoliciesQuery extends DatabaseQuery<AuthPolicyRow[]> {
	constructor(private readonly filter?: { projectId: string | null }) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<AuthPolicyRow[]> {
		let qb = SelectBuilder.create<AuthPolicyRow>()
			.from('auth_policy')
			.select(new Literal('*'))
		if (this.filter !== undefined) {
			const projectId = this.filter.projectId
			qb = qb.where(expr => projectId === null ? expr.isNull('project_id') : expr.compare('project_id', '=', projectId))
		}
		return await qb.getResult(db)
	}
}
