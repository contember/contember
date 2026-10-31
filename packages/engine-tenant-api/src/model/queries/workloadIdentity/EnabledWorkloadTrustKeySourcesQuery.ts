import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { WorkloadKeySource } from '../../service/workloadIdentity/verification/WorkloadJwksRegistry.js'

/** Distinct key sources of the enabled trusts, for prewarming the JWKS registry (§11). */
export class EnabledWorkloadTrustKeySourcesQuery extends DatabaseQuery<readonly WorkloadKeySource[]> {
	async fetch({ db }: DatabaseQueryable): Promise<readonly WorkloadKeySource[]> {
		const rows = await SelectBuilder.create<{ issuer: string; jwks_uri: string | null }>()
			.select(['workload_identity_trust', 'issuer'])
			.select(['workload_identity_trust', 'jwks_uri'])
			.distinct()
			.from('workload_identity_trust')
			.where(it => it.isNull(['workload_identity_trust', 'disabled_at']))
			.getResult(db)
		return rows.map(it => ({ issuer: it.issuer, jwksUri: it.jwks_uri }))
	}
}
