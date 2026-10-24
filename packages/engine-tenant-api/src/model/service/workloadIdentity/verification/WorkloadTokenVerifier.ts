import { DatabaseContext } from '../../../utils/index.js'
import { Response } from '../../../utils/Response.js'
import { WorkloadIdentity } from '../../../type/index.js'
import { VerifyResult } from '../../apiKey/ApiKeyManager.js'
import { WorkloadJwksRegistry } from './WorkloadJwksRegistry.js'

export type WorkloadAuthScheme = 'Bearer' | 'DPoP'

export interface WorkloadAuthRequest {
	readonly token: string
	readonly scheme: WorkloadAuthScheme
	/** Every `DPoP` header value of the request; anything but exactly one is an error when a proof is needed. */
	readonly dpopProofs: readonly string[]
	readonly method: string
	/** Client-facing request URL without query and fragment (§8a `htu`). */
	readonly url: string
}

/** Stable internal failure categories (§8.7); externally every one of them is the same generic 401. */
export type WorkloadAuthFailureCategory =
	| WorkloadTokenCheckStep
	| 'dpop_missing'
	| 'dpop_invalid'
	| 'dpop_binding'
	| 'dpop_replay'

/** Mirrors the `WorkloadIdentityTokenCheckStep` SDL enum. */
export type WorkloadTokenCheckStep =
	| 'malformed'
	| 'trust_not_found'
	| 'jwks'
	| 'signature'
	| 'typ'
	| 'audience'
	| 'profile'
	| 'lifetime'
	| 'tokens_valid_after'
	| 'condition'

export type WorkloadTokenCheckResult =
	| {
		readonly ok: true
		readonly trust: WorkloadIdentity.TrustRow
		readonly claims: Readonly<Record<string, unknown>>
	}
	| {
		readonly ok: false
		readonly trust: WorkloadIdentity.TrustRow | null
		readonly failure: {
			readonly step: WorkloadTokenCheckStep
			readonly message: string
			readonly conditionIndex?: number
			readonly actualValue?: unknown
		}
	}

export interface WorkloadAuthHttpInfo {
	readonly ip?: string
	readonly userAgent?: string
}

export class WorkloadTokenVerifier {
	constructor(
		private readonly jwksRegistry: WorkloadJwksRegistry,
	) {}

	/**
	 * The JWT branch of request authentication (§8, §8a): lookup on the read replica, verification,
	 * conditions, DPoP, and the deduplicated / rate-limited auth log write (detached, never on the hot path).
	 */
	public async authenticate(
		db: { readonly read: DatabaseContext; readonly write: DatabaseContext },
		request: WorkloadAuthRequest,
		httpInfo: WorkloadAuthHttpInfo,
	): Promise<Response<VerifyResult, WorkloadAuthFailureCategory>> {
		throw new Error('not implemented')
	}

	/** §15 diagnostics: §8.2–§8.6 without DPoP and without any auth log write. */
	public async check(db: DatabaseContext, token: string): Promise<WorkloadTokenCheckResult> {
		throw new Error('not implemented')
	}

	/** Prewarms the keys of every enabled trust of this tenant (§11). */
	public async prewarm(db: DatabaseContext): Promise<void> {
		throw new Error('not implemented')
	}
}
