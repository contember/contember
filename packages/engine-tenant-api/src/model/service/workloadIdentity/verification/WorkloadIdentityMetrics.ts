import { WorkloadAuthFailureCategory } from './WorkloadTokenVerifier.js'

/** Implemented by the engine with prom-client; tenant-api only reports. */
export interface WorkloadIdentityMetrics {
	verification(outcome: 'success' | WorkloadAuthFailureCategory): void
	jwksFetchFailure(): void
	unknownKid(): void
}

export const noopWorkloadIdentityMetrics: WorkloadIdentityMetrics = {
	verification: () => {},
	jwksFetchFailure: () => {},
	unknownKid: () => {},
}
