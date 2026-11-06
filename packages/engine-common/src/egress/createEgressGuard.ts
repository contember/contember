import { EgressGuard } from './EgressGuard.js'
import { EgressPolicy } from './EgressPolicy.js'

export interface EgressConfig {
	/** Opt-in: unset, outgoing requests to tenant-chosen URLs are not restricted. */
	readonly guard?: boolean
	readonly allowHttp?: boolean
	readonly allowlist?: readonly string[]
}

export const createEgressGuard = (config: EgressConfig | undefined): EgressGuard | null =>
	config?.guard === true
		? new EgressGuard(new EgressPolicy({ allowHttp: config.allowHttp ?? false, allowlist: config.allowlist ?? [] }))
		: null
