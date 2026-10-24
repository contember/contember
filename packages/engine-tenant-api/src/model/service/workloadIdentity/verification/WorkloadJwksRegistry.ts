import { WorkloadIdentity } from '../../../type/index.js'

/** Where a trust's keys come from: `jwksUri` when set, otherwise OIDC discovery on `issuer`. */
export interface WorkloadKeySource {
	readonly issuer: string
	readonly jwksUri: string | null
}

/**
 * Process-wide JWKS / discovery cache for workload trusts (§11), keyed by key source and fetch policy.
 * Public keys are the only material it holds, so one instance serves every tenant.
 */
export class WorkloadJwksRegistry {
	constructor(
		public readonly config: WorkloadIdentity.InstanceConfig,
	) {}

	/** Fetches (or refreshes in the background) the keys of these sources ahead of the first request. */
	public async prewarm(sources: readonly WorkloadKeySource[]): Promise<void> {
		throw new Error('not implemented')
	}

	/** Stops background refresh timers. */
	public dispose(): void {
		throw new Error('not implemented')
	}
}
