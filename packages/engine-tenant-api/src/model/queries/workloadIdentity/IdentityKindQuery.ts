import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { DatabaseContext } from '../../utils/index.js'

export type IdentityKindValue = 'person' | 'api_key' | 'workload'

/**
 * An identity is a workload identity iff a trust references it, a person iff a person row does;
 * anything else is an api key identity. Identities without a row are left out.
 */
export class IdentityKindQuery extends DatabaseQuery<ReadonlyMap<string, IdentityKindValue>> {
	constructor(
		private readonly identityIds: readonly string[],
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ReadonlyMap<string, IdentityKindValue>> {
		if (this.identityIds.length === 0) {
			return new Map()
		}
		const rows = await SelectBuilder.create<{ id: string; is_person: boolean; is_workload: boolean }>()
			.select(['identity', 'id'])
			.select(
				it => it.selectCondition(cond => cond.exists(qb => qb.from('person').where(it => it.columnsEq(['person', 'identity_id'], ['identity', 'id'])))),
				'is_person',
			)
			.select(
				it =>
					it.selectCondition(cond =>
						cond.exists(qb => qb.from('workload_identity_trust').where(it => it.columnsEq(['workload_identity_trust', 'identity_id'], ['identity', 'id'])))
					),
				'is_workload',
			)
			.from('identity')
			.where(it => it.in(['identity', 'id'], [...this.identityIds]))
			.getResult(db)
		return new Map(rows.map(row => [row.id, row.is_workload ? 'workload' : row.is_person ? 'person' : 'api_key']))
	}
}

/** Workload identities are managed exclusively through apply; identity-targeted grant mutations refuse them (§6a). */
export const isWorkloadIdentity = async (db: DatabaseContext, identityId: string): Promise<boolean> =>
	(await db.queryHandler.fetch(new IdentityKindQuery([identityId]))).get(identityId) === 'workload'
