import prom from 'prom-client'
import { WorkloadIdentityMetrics } from '@contember/engine-tenant-api'

/** Process-wide, shared by every tenant container (§8.7, §11). */
export const createWorkloadIdentityMetrics = (registry: prom.Registry): WorkloadIdentityMetrics => {
	const verifications = new prom.Counter({
		name: 'contember_workload_identity_verifications_total',
		help: 'Workload identity token verifications by outcome: success, or the internal failure category (externally every failure is the same 401)',
		registers: [registry],
		labelNames: ['outcome'],
	})
	const jwksFetchFailures = new prom.Counter({
		name: 'contember_workload_identity_jwks_fetch_failures_total',
		help: 'Failed workload identity issuer discovery or JWKS fetches',
		registers: [registry],
	})
	const unknownKids = new prom.Counter({
		name: 'contember_workload_identity_unknown_kid_total',
		help: 'Workload identity tokens signed with a key id missing from the cached JWKS',
		registers: [registry],
	})
	return {
		verification: outcome => verifications.inc({ outcome }),
		jwksFetchFailure: () => jwksFetchFailures.inc(),
		unknownKid: () => unknownKids.inc(),
	}
}
