import { expect, test } from 'bun:test'
import prom from 'prom-client'
import { createWorkloadIdentityMetrics } from '../../../src/prometheus/workloadIdentityMetrics.js'

test('workload identity metrics count outcomes by category, JWKS fetch failures and unknown key ids', async () => {
	const registry = new prom.Registry()
	const metrics = createWorkloadIdentityMetrics(registry)
	metrics.verification('success')
	metrics.verification('success')
	metrics.verification('condition')
	metrics.jwksFetchFailure()
	metrics.unknownKid()

	const output = await registry.metrics()
	expect(output).toContain('contember_workload_identity_verifications_total{outcome="success"} 2')
	expect(output).toContain('contember_workload_identity_verifications_total{outcome="condition"} 1')
	expect(output).toContain('contember_workload_identity_jwks_fetch_failures_total 1')
	expect(output).toContain('contember_workload_identity_unknown_kid_total 1')
})
