import { createHash } from 'node:crypto'
import { decodeJwt, errors, JWTPayload, jwtVerify, JWTVerifyResult } from 'jose'
import { JSONValue } from '@contember/schema'
import { DatabaseContext } from '../../../utils/index.js'
import { Response, ResponseError, ResponseOk } from '../../../utils/Response.js'
import { WorkloadIdentity } from '../../../type/index.js'
import { Providers } from '../../../providers.js'
import { VerifyResult } from '../../apiKey/ApiKeyManager.js'
import { AuthLogService } from '../../AuthLogService.js'
import { findFailingCondition } from '../conditions.js'
import { ASYMMETRIC_SIGNING_ALGS, AUDIT_CLAIMS, CLOCK_TOLERANCE_SECONDS, workloadProfiles } from '../profiles.js'
import { WorkloadTrustLookupQuery } from '../../../queries/workloadIdentity/WorkloadTrustLookupQuery.js'
import { EnabledWorkloadTrustKeySourcesQuery } from '../../../queries/workloadIdentity/EnabledWorkloadTrustKeySourcesQuery.js'
import { WorkloadJwksRegistry, WorkloadJwksUnavailableError } from './WorkloadJwksRegistry.js'
import { WorkloadIdentityMetrics } from './WorkloadIdentityMetrics.js'
import { DpopFailure, DpopProofVerifier } from './DpopProofVerifier.js'
import { ExpiringSet } from './ExpiringSet.js'
import { TokenBuckets } from './TokenBucket.js'

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

type CheckFailure = Extract<WorkloadTokenCheckResult, { ok: false }>['failure']

/** The outcome of §8.2–§8.6; `unverified` holds the bounded audit view of the decoded payload. */
type Evaluation =
	| {
		readonly ok: true
		readonly trust: WorkloadIdentity.TrustRow
		readonly claims: JWTPayload
		readonly tokenRef: string
		readonly exp: number
		readonly unverified: Record<string, JSONValue>
	}
	| {
		readonly ok: false
		readonly trust: WorkloadIdentity.TrustRow | null
		readonly failure: CheckFailure
		readonly unverified: Record<string, JSONValue>
	}

type ParsedAudience =
	| { readonly type: 'scalar'; readonly value: string }
	| { readonly type: 'array'; readonly values: readonly string[] }

const MAX_TOKEN_LENGTH = 8 * 1024
const MAX_CLAIM_LENGTH = 2048
const MAX_AUDIENCES = 10
const MAX_AUDIT_VALUE_LENGTH = 256
const MAX_ERROR_MESSAGE_LENGTH = 512
const JWT_SHAPE = /^[\w-]+\.[\w-]+\.[\w-]+$/
const MAX_LOGGED_TOKENS = 100_000
const FAILURE_LOG_BURST = 10
const FAILURE_LOG_PER_SECOND = 1 / 6
const NO_TRUST_BUCKET = 'trust_not_found'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const auditValue = (value: unknown): JSONValue | undefined => {
	if (typeof value === 'string') {
		return value.slice(0, MAX_AUDIT_VALUE_LENGTH)
	}
	if ((typeof value === 'number' && Number.isFinite(value)) || typeof value === 'boolean') {
		return value
	}
	return undefined
}

const compact = (entries: readonly (readonly [string, JSONValue | undefined])[]): Record<string, JSONValue> => {
	const result: Record<string, JSONValue> = {}
	for (const [key, value] of entries) {
		if (value !== undefined) {
			result[key] = value
		}
	}
	return result
}

const unverifiedMetadata = (payload: JWTPayload): Record<string, JSONValue> => {
	const aud = Array.isArray(payload.aud)
		? payload.aud.slice(0, MAX_AUDIENCES).map(auditValue).filter((it): it is JSONValue => it !== undefined)
		: auditValue(payload.aud)
	return compact([
		['unverified_iss', auditValue(payload.iss)],
		['unverified_aud', aud],
		['unverified_sub', auditValue(payload.sub)],
		['unverified_jti', auditValue(payload.jti)],
	])
}

const isBoundedString = (value: unknown): value is string => typeof value === 'string' && value !== '' && value.length <= MAX_CLAIM_LENGTH

/** §8.3: a string or a single-element array is the audience; a wider array only reaches trusts that opt in. */
const parseAudience = (value: unknown): ParsedAudience | 'malformed' | 'empty' => {
	if (isBoundedString(value)) {
		return { type: 'scalar', value }
	}
	if (!Array.isArray(value) || value.length > MAX_AUDIENCES || !value.every(isBoundedString)) {
		return 'malformed'
	}
	if (value.length === 0) {
		return 'empty'
	}
	return value.length === 1 ? { type: 'scalar', value: value[0] } : { type: 'array', values: [...new Set(value)] }
}

const tokenReference = (token: string, jti: unknown): string =>
	typeof jti === 'string' && jti !== '' && jti.length <= MAX_AUDIT_VALUE_LENGTH
		? jti
		: `sha256:${createHash('sha256').update(token).digest('hex')}`

const signatureStepOf = (e: unknown): CheckFailure => {
	const message = e instanceof Error ? e.message : String(e)
	if (e instanceof WorkloadJwksUnavailableError) {
		return { step: 'jwks', message }
	}
	if (e instanceof errors.JWTExpired) {
		return { step: 'lifetime', message }
	}
	if (e instanceof errors.JWTClaimValidationFailed) {
		if (e.reason === 'missing') {
			return { step: 'profile', message }
		}
		if (e.claim === 'aud') {
			return { step: 'audience', message }
		}
		if (e.claim === 'iat' || e.claim === 'nbf' || e.claim === 'exp') {
			return { step: 'lifetime', message }
		}
		return { step: 'malformed', message }
	}
	if (e instanceof errors.JWTInvalid || e instanceof errors.JWSInvalid) {
		return { step: 'malformed', message }
	}
	return { step: 'signature', message }
}

export class WorkloadTokenVerifier {
	private readonly dpopVerifier = new DpopProofVerifier()
	private readonly loggedTokens = new ExpiringSet(MAX_LOGGED_TOKENS, 'evict')
	private readonly failureLogBuckets = new TokenBuckets(FAILURE_LOG_BURST, FAILURE_LOG_PER_SECOND, 10_000)

	constructor(
		private readonly jwksRegistry: WorkloadJwksRegistry,
		private readonly metrics: WorkloadIdentityMetrics,
		private readonly authLogService: AuthLogService,
		private readonly providers: Pick<Providers, 'now'>,
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
		const now = this.providers.now()
		const evaluation = await this.evaluate(db.read, request.token, now)
		if (!evaluation.ok) {
			return this.reject(db.write, evaluation.trust, evaluation.failure.step, evaluation.failure.message, evaluation.unverified, httpInfo, now)
		}
		const { trust, claims, tokenRef } = evaluation
		const dpopFailure = await this.checkProofOfPossession(request, trust, claims, now)
		if (dpopFailure !== null) {
			return this.reject(db.write, trust, dpopFailure.category, dpopFailure.message, evaluation.unverified, httpInfo, now)
		}
		this.metrics.verification('success')
		this.logSuccess(db.write, evaluation, httpInfo, now)
		return new ResponseOk(
			new VerifyResult(
				trust.identityId,
				{ type: 'workload_trust', trustId: trust.id, trustSlug: trust.slug, tokenRef },
				[...trust.roles],
				null,
				trust.trustForwardedInfo,
			),
		)
	}

	/** §15 diagnostics: §8.2–§8.6 without DPoP and without any auth log write. */
	public async check(db: DatabaseContext, token: string): Promise<WorkloadTokenCheckResult> {
		const evaluation = await this.evaluate(db, token, this.providers.now())
		return evaluation.ok
			? { ok: true, trust: evaluation.trust, claims: evaluation.claims }
			: { ok: false, trust: evaluation.trust, failure: evaluation.failure }
	}

	/** Prewarms the keys of every enabled trust of this tenant (§11). */
	public async prewarm(db: DatabaseContext): Promise<void> {
		const sources = await db.queryHandler.fetch(new EnabledWorkloadTrustKeySourcesQuery())
		await this.jwksRegistry.prewarm(sources)
	}

	private async evaluate(db: DatabaseContext, token: string, now: Date): Promise<Evaluation> {
		if (token.length > MAX_TOKEN_LENGTH || !JWT_SHAPE.test(token)) {
			return { ok: false, trust: null, failure: { step: 'malformed', message: 'The token is not a compact JWS of a bounded size' }, unverified: {} }
		}
		let payload: JWTPayload
		try {
			payload = decodeJwt(token)
		} catch (e) {
			return { ok: false, trust: null, failure: { step: 'malformed', message: e instanceof Error ? e.message : String(e) }, unverified: {} }
		}
		const unverified = unverifiedMetadata(payload)
		const fail = (trust: WorkloadIdentity.TrustRow | null, failure: CheckFailure): Evaluation => ({ ok: false, trust, failure, unverified })

		const issuer = payload.iss
		if (!isBoundedString(issuer)) {
			return fail(null, { step: 'malformed', message: 'The iss claim is missing or not a bounded string' })
		}
		const audience = parseAudience(payload.aud)
		if (audience === 'malformed') {
			return fail(null, { step: 'malformed', message: 'The aud claim is missing or not a bounded string or string array' })
		}
		if (audience === 'empty') {
			return fail(null, { step: 'audience', message: 'The aud claim is an empty array' })
		}

		const candidates = await db.queryHandler.fetch(
			new WorkloadTrustLookupQuery(issuer, audience.type === 'scalar' ? [audience.value] : audience.values),
		)
		const selected = this.selectTrust(audience, candidates)
		if (!selected.ok) {
			return fail(selected.trust, selected.failure)
		}
		const trust = selected.trust

		let verified: JWTVerifyResult
		try {
			verified = await jwtVerify(token, this.jwksRegistry.getKeyResolver(trust), {
				issuer: trust.issuer,
				audience: trust.audience,
				algorithms: trust.signingAlgs.filter(it => ASYMMETRIC_SIGNING_ALGS.includes(it)),
				requiredClaims: [...workloadProfiles[trust.profile].requiredClaims],
				clockTolerance: CLOCK_TOLERANCE_SECONDS,
				currentDate: now,
			})
		} catch (e) {
			return fail(trust, signatureStepOf(e))
		}
		const { payload: claims, protectedHeader } = verified

		// jose's `typ` option cannot express "no header", which a `null` element accepts.
		const typ = protectedHeader.typ
		if (!(typ === undefined ? trust.acceptedTyp.includes(null) : trust.acceptedTyp.includes(typ))) {
			return fail(trust, { step: 'typ', message: `The typ header ${typ === undefined ? 'is missing' : `"${typ}"`} is not accepted` })
		}

		const { iat, exp } = claims
		if (typeof iat !== 'number' || typeof exp !== 'number') {
			return fail(trust, { step: 'profile', message: 'The iat and exp claims are required' })
		}
		const lifetimeFailure = this.checkFreshness(trust, iat, exp, now)
		if (lifetimeFailure !== null) {
			return fail(trust, lifetimeFailure)
		}

		const failingCondition = findFailingCondition(trust.conditions, claims)
		if (failingCondition !== null) {
			return fail(trust, {
				step: 'condition',
				message: `Condition #${failingCondition.index} does not match`,
				conditionIndex: failingCondition.index,
				actualValue: failingCondition.actualValue,
			})
		}

		return { ok: true, trust, claims, tokenRef: tokenReference(token, claims.jti), exp, unverified }
	}

	private selectTrust(
		audience: ParsedAudience,
		candidates: readonly WorkloadIdentity.TrustRow[],
	):
		| { readonly ok: true; readonly trust: WorkloadIdentity.TrustRow }
		| { readonly ok: false; readonly trust: WorkloadIdentity.TrustRow | null; readonly failure: CheckFailure }
	{
		if (candidates.length === 0) {
			return { ok: false, trust: null, failure: { step: 'trust_not_found', message: 'No enabled trust matches the token issuer and audience' } }
		}
		if (audience.type === 'scalar') {
			// The partial unique index admits one enabled trust per (issuer, audience).
			return { ok: true, trust: candidates[0] }
		}
		const accepting = candidates.filter(it => it.acceptAudienceArray && workloadProfiles[it.profile].allowsAudienceArray)
		if (accepting.length === 1) {
			return { ok: true, trust: accepting[0] }
		}
		return {
			ok: false,
			trust: candidates.length === 1 ? candidates[0] : null,
			failure: {
				step: 'audience',
				message: accepting.length === 0
					? 'The aud claim is a multi-valued array, which no matching trust accepts'
					: 'The aud claim matches more than one trust that accepts audience arrays',
			},
		}
	}

	/** §8.5: `iat` not in the future, `exp > iat`, lifetime within the trust and profile caps, `iat >= tokens_valid_after`. */
	private checkFreshness(trust: WorkloadIdentity.TrustRow, iat: number, exp: number, now: Date): CheckFailure | null {
		const nowSeconds = Math.floor(now.getTime() / 1000)
		if (iat > nowSeconds + CLOCK_TOLERANCE_SECONDS) {
			return { step: 'lifetime', message: 'The iat claim is in the future' }
		}
		if (exp <= iat) {
			return { step: 'lifetime', message: 'The exp claim is not after iat' }
		}
		const maxLifetime = Math.min(trust.maxTokenLifetimeSeconds, workloadProfiles[trust.profile].maxLifetimeSeconds)
		if (exp - iat > maxLifetime) {
			return { step: 'lifetime', message: `The token lifetime ${exp - iat} s exceeds the maximum of ${maxLifetime} s` }
		}
		if (iat < trust.tokensValidAfter - CLOCK_TOLERANCE_SECONDS) {
			return { step: 'tokens_valid_after', message: 'The token was issued before the trust last changed its principal selection' }
		}
		return null
	}

	/** §8a: a token with `cnf` is never accepted without a valid proof; `requireDpop` rejects an unbound token. */
	private async checkProofOfPossession(
		request: WorkloadAuthRequest,
		trust: WorkloadIdentity.TrustRow,
		claims: JWTPayload,
		now: Date,
	): Promise<DpopFailure | null> {
		const cnf = claims.cnf
		let jkt: string | null = null
		if (cnf !== undefined) {
			if (!isRecord(cnf) || !isBoundedString(cnf.jkt) || Object.keys(cnf).length !== 1) {
				return { category: 'dpop_binding', message: 'The token carries a cnf claim other than cnf.jkt' }
			}
			jkt = cnf.jkt
		}
		if (jkt === null) {
			if (trust.requireDpop) {
				return { category: 'dpop_binding', message: 'The trust requires DPoP, but the token is not bound' }
			}
			if (request.scheme === 'DPoP') {
				return { category: 'dpop_binding', message: 'The DPoP scheme was used with a token that is not bound' }
			}
			return null
		}
		if (request.scheme !== 'DPoP') {
			return { category: 'dpop_binding', message: 'A bound token must use the DPoP scheme' }
		}
		return await this.dpopVerifier.verify({
			proofs: request.dpopProofs,
			accessToken: request.token,
			jkt,
			method: request.method,
			url: request.url,
			algorithms: trust.signingAlgs.filter(it => ASYMMETRIC_SIGNING_ALGS.includes(it)),
			now,
		})
	}

	private reject(
		db: DatabaseContext,
		trust: WorkloadIdentity.TrustRow | null,
		category: WorkloadAuthFailureCategory,
		message: string,
		unverified: Record<string, JSONValue>,
		httpInfo: WorkloadAuthHttpInfo,
		now: Date,
	): ResponseError<WorkloadAuthFailureCategory> {
		this.metrics.verification(category)
		if (this.failureLogBuckets.take(trust?.id ?? NO_TRUST_BUCKET, now.getTime())) {
			this.detached(() =>
				this.authLogService.logWorkloadAuth(db, {
					success: false,
					trustId: trust?.id ?? null,
					errorCode: category,
					errorMessage: message.slice(0, MAX_ERROR_MESSAGE_LENGTH),
					ipAddress: httpInfo.ip,
					userAgent: httpInfo.userAgent,
					metadata: { ...compact([['trustSlug', trust?.slug]]), ...unverified },
				})
			)
		}
		return new ResponseError(category, message)
	}

	private logSuccess(db: DatabaseContext, evaluation: Extract<Evaluation, { ok: true }>, httpInfo: WorkloadAuthHttpInfo, now: Date): void {
		const { trust, claims, tokenRef, exp } = evaluation
		// Only the first sighting of a token writes; the unique index keeps a fleet at one row per token.
		if (this.loggedTokens.add(`${trust.id}\n${tokenRef}`, exp * 1000, now.getTime()) !== 'added') {
			return
		}
		const cnf = claims.cnf
		const eventData = compact([
			['trustSlug', trust.slug],
			['iss', auditValue(claims.iss)],
			['sub', auditValue(claims.sub)],
			['jti', auditValue(claims.jti)],
			['cnfJkt', isRecord(cnf) ? auditValue(cnf.jkt) : undefined],
			['claims', compact(AUDIT_CLAIMS[trust.profile].map(it => [it, auditValue(claims[it])]))],
		])
		this.detached(() =>
			this.authLogService.logWorkloadAuth(db, {
				success: true,
				trustId: trust.id,
				identityId: trust.identityId,
				tokenRef,
				ipAddress: httpInfo.ip,
				userAgent: httpInfo.userAgent,
				metadata: { trustSlug: trust.slug },
				eventData,
			})
		)
	}

	/** Runs after the response; a rejection here would be an unhandledRejection, and the audit write is best-effort. */
	private detached(write: () => Promise<void>): void {
		setImmediate(() => {
			write().catch(() => {})
		})
	}
}
