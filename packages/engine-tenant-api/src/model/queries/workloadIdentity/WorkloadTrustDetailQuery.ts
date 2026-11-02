import { DatabaseQuery, DatabaseQueryable, Operator, SelectBuilder } from '@contember/database'
import { WorkloadIdentity } from '../../type/index.js'
import { createWorkloadTrustQuery, createWorkloadTrustRow } from './trustRow.js'

type WorkloadTrustDetailDbRow =
	& Parameters<typeof createWorkloadTrustRow>[0]
	& {
		created_at: Date
		updated_at: Date
		tokens_valid_after: Date
	}

/** A trust together with the timestamps the listing reports. */
export interface WorkloadTrustDetail {
	readonly trust: WorkloadIdentity.TrustRow
	readonly createdAt: Date
	readonly updatedAt: Date
	readonly tokensValidAfter: Date
}

export type WorkloadTrustDetailFilter =
	| { readonly slug: string }
	| { readonly id: string }
	| { readonly identityIds: readonly string[] }

/** Enabled and disabled trusts, all of them or the ones matching the filter, ordered by slug. */
export class WorkloadTrustDetailQuery extends DatabaseQuery<readonly WorkloadTrustDetail[]> {
	constructor(
		private readonly filter: WorkloadTrustDetailFilter | null,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<readonly WorkloadTrustDetail[]> {
		const filter = this.filter
		if (filter !== null && 'identityIds' in filter && filter.identityIds.length === 0) {
			return []
		}
		const trusts = createWorkloadTrustQuery()
			.select(['workload_identity_trust', 'created_at'])
			.select(['workload_identity_trust', 'updated_at'])
			.select(['workload_identity_trust', 'tokens_valid_after'])
			.match(qb => {
				if (filter === null) {
					return qb
				}
				if ('slug' in filter) {
					return qb.where(it => it.compare(['workload_identity_trust', 'slug'], Operator.eq, filter.slug))
				}
				if ('id' in filter) {
					return qb.where(it => it.compare(['workload_identity_trust', 'id'], Operator.eq, filter.id))
				}
				return qb.where(it => it.in(['workload_identity_trust', 'identity_id'], [...filter.identityIds]))
			})
		// The shared trust select is extended through a CTE, so this query declares the full row it reads.
		const rows = await SelectBuilder.create<WorkloadTrustDetailDbRow>()
			.with('trust', trusts)
			.select(it => it.raw('*'))
			.from('trust')
			.orderBy(['trust', 'slug'])
			.getResult(db)
		return rows.map(row => ({
			trust: createWorkloadTrustRow(row),
			createdAt: row.created_at,
			updatedAt: row.updated_at,
			tokensValidAfter: row.tokens_valid_after,
		}))
	}
}
