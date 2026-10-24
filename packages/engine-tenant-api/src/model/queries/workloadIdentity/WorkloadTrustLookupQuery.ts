import { DatabaseQuery, DatabaseQueryable, Operator } from '@contember/database'
import { WorkloadIdentity } from '../../type/index.js'
import { createWorkloadTrustQuery, createWorkloadTrustRow } from './trustRow.js'

/**
 * Enabled trusts of `issuer` whose audience is one of `audiences` (§8.4): a direct indexed lookup on the request's
 * own tenant database, never cached, so a disable or an apply is effective on the next request.
 */
export class WorkloadTrustLookupQuery extends DatabaseQuery<readonly WorkloadIdentity.TrustRow[]> {
	constructor(
		private readonly issuer: string,
		private readonly audiences: readonly string[],
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<readonly WorkloadIdentity.TrustRow[]> {
		if (this.audiences.length === 0) {
			return []
		}
		const rows = await createWorkloadTrustQuery()
			.where(it =>
				it
					.compare(['workload_identity_trust', 'issuer'], Operator.eq, this.issuer)
					.in(['workload_identity_trust', 'audience'], [...this.audiences])
					.isNull(['workload_identity_trust', 'disabled_at'])
			)
			.getResult(db)
		return rows.map(createWorkloadTrustRow)
	}
}
