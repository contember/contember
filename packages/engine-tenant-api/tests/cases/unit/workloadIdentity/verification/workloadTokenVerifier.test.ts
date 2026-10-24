import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { base64url, calculateJwkThumbprint, CryptoKey, exportJWK, generateKeyPair, JWK, JWTPayload, SignJWT } from 'jose'
import { JSONValue } from '@contember/schema'
import { AuthLogService, DatabaseContext, WorkloadAuthRequest, WorkloadJwksRegistry, WorkloadTokenVerifier } from '../../../../../src/index.js'
import { createDb, instanceConfig, TestIssuer, TrustDbRow, trustLookup } from './testIssuer.js'

const AUDIENCE = 'contember:test:web-backend'
const URL_ = 'https://api.example.com/content/website/live'
const NOW = new Date()
const NOW_S = Math.floor(NOW.getTime() / 1000)

type LoggedEntry = Parameters<AuthLogService['logWorkloadAuth']>[1]

class RecordingAuthLogService extends AuthLogService {
	public readonly entries: LoggedEntry[] = []

	override async logWorkloadAuth(_db: DatabaseContext, entry: LoggedEntry): Promise<void> {
		this.entries.push(entry)
	}
}

let issuer: TestIssuer
let registry: WorkloadJwksRegistry

beforeAll(async () => {
	issuer = await TestIssuer.start()
	registry = new WorkloadJwksRegistry(instanceConfig, { refreshIntervalSeconds: 3600 })
})

afterAll(async () => {
	registry.dispose()
	await issuer.stop()
})

const trustRow = (overrides: Partial<TrustDbRow> = {}): TrustDbRow => ({
	id: 'trust-1',
	slug: 'web-backend',
	identity_id: 'identity-1',
	issuer: issuer.issuer,
	audience: AUDIENCE,
	profile: 'oidc',
	jwks_uri: null,
	signing_algs: ['RS256', 'ES256'],
	accepted_typ: ['JWT', null],
	accept_audience_array: false,
	require_dpop: false,
	conditions: [{ claim: 'sub', equals: 'web-backend' }],
	max_token_lifetime_seconds: 3600,
	tokens_valid_after_epoch: String(NOW_S - 3600),
	trust_forwarded_info: false,
	disabled: false,
	description: null,
	roles: [],
	...overrides,
})

const claims = (overrides: JWTPayload = {}): JWTPayload => ({
	iss: issuer.issuer,
	aud: AUDIENCE,
	sub: 'web-backend',
	iat: NOW_S - 10,
	exp: NOW_S + 290,
	jti: 'token-1',
	...overrides,
})

const createVerifier = () => {
	const authLog = new RecordingAuthLogService()
	const outcomes: string[] = []
	const verifier = new WorkloadTokenVerifier(
		registry,
		{ verification: outcome => outcomes.push(outcome), jwksFetchFailure: () => {}, unknownKid: () => {} },
		authLog,
		{ now: () => NOW },
	)
	return { verifier, authLog, outcomes }
}

const check = async (token: string, rows: TrustDbRow[] = [trustRow()], audiences: readonly string[] = [AUDIENCE]) => {
	const queries = [trustLookup(issuer.issuer, audiences, rows)]
	const result = await createVerifier().verifier.check(createDb(queries, NOW), token)
	expect(queries).toHaveLength(0)
	return result
}

const failedStep = async (token: string, rows?: TrustDbRow[], audiences?: readonly string[]) => {
	const result = await check(token, rows, audiences)
	return result.ok ? 'ok' : result.failure.step
}

const checkWithoutLookup = async (token: string) => {
	const result = await createVerifier().verifier.check(createDb([], NOW), token)
	return result.ok ? 'ok' : result.failure.step
}

const settle = () => new Promise(resolve => setTimeout(resolve, 10))

describe('audience canonicalization', () => {
	test('a string audience', async () => {
		expect(await failedStep(await issuer.sign(claims()))).toBe('ok')
	})

	test('a single-element array is canonicalized to the scalar', async () => {
		expect(await failedStep(await issuer.sign(claims({ aud: [AUDIENCE] })))).toBe('ok')
	})

	test('a multi-valued array is rejected without the opt-in', async () => {
		const token = await issuer.sign(claims({ aud: [AUDIENCE, 'account'] }))
		expect(await failedStep(token, [trustRow()], [AUDIENCE, 'account'])).toBe('audience')
	})

	test('a multi-valued array is accepted with acceptAudienceArray', async () => {
		const token = await issuer.sign(claims({ aud: [AUDIENCE, 'account'] }))
		expect(await failedStep(token, [trustRow({ accept_audience_array: true })], [AUDIENCE, 'account'])).toBe('ok')
	})

	test('an empty array is rejected before any lookup', async () => {
		expect(await checkWithoutLookup(await issuer.sign(claims({ aud: [] })))).toBe('audience')
	})

	test('an unregistered (issuer, audience) is trust_not_found', async () => {
		expect(await failedStep(await issuer.sign(claims()), [])).toBe('trust_not_found')
	})
})

describe('token profile', () => {
	test('a wrong typ is rejected', async () => {
		expect(await failedStep(await issuer.sign(claims(), { typ: 'at+jwt' }))).toBe('typ')
	})

	test('a missing typ passes only when null is accepted', async () => {
		const token = await issuer.sign(claims(), { typ: null })
		expect(await failedStep(token)).toBe('ok')
		expect(await failedStep(token, [trustRow({ accepted_typ: ['JWT'] })])).toBe('typ')
	})

	test('a github-actions token without its discriminator claims is rejected', async () => {
		const row = trustRow({
			profile: 'github-actions',
			signing_algs: ['RS256'],
			accepted_typ: ['JWT'],
			conditions: [{ claim: 'repository_id', equals: '1' }],
		})
		expect(await failedStep(await issuer.sign(claims({ repository_id: '1', run_id: '2' })), [row])).toBe('profile')
		expect(await failedStep(await issuer.sign(claims({ repository_id: '1', repository_owner_id: '3', run_id: '2' })), [row])).toBe('ok')
	})

	test('HS256 is rejected whatever the key', async () => {
		const token = await new SignJWT(claims()).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).sign(new TextEncoder().encode('x'.repeat(32)))
		expect(await failedStep(token)).toBe('signature')
	})

	test('alg none is rejected', async () => {
		const header = base64url.encode(JSON.stringify({ alg: 'none', typ: 'JWT' }))
		const payload = base64url.encode(JSON.stringify(claims()))
		expect(await checkWithoutLookup(`${header}.${payload}.`)).toBe('malformed')
		expect(await failedStep(`${header}.${payload}.c2ln`)).toBe('signature')
	})

	test('a token signed by an unknown key is rejected', async () => {
		const { privateKey } = await generateKeyPair('RS256')
		const token = await new SignJWT(claims()).setProtectedHeader({ alg: 'RS256', kid: 'key-1', typ: 'JWT' }).sign(privateKey)
		expect(await failedStep(token)).toBe('signature')
	})
})

describe('freshness', () => {
	test('a future iat is rejected', async () => {
		expect(await failedStep(await issuer.sign(claims({ iat: NOW_S + 120, exp: NOW_S + 300 })))).toBe('lifetime')
	})

	test('exp not after iat is rejected', async () => {
		const result = await check(await issuer.sign(claims({ iat: NOW_S + 20, exp: NOW_S + 10 })))
		expect(result.ok ? null : result.failure).toMatchObject({ step: 'lifetime', message: 'The exp claim is not after iat' })
	})

	test('a lifetime over the trust cap is rejected', async () => {
		const token = await issuer.sign(claims({ iat: NOW_S, exp: NOW_S + 600 }))
		expect(await failedStep(token, [trustRow({ max_token_lifetime_seconds: 300 })])).toBe('lifetime')
		expect(await failedStep(token, [trustRow({ max_token_lifetime_seconds: 600 })])).toBe('ok')
	})

	test('an iat before tokens_valid_after is rejected', async () => {
		const token = await issuer.sign(claims({ iat: NOW_S - 100 }))
		expect(await failedStep(token, [trustRow({ tokens_valid_after_epoch: String(NOW_S) })])).toBe('tokens_valid_after')
		expect(await failedStep(token, [trustRow({ tokens_valid_after_epoch: String(NOW_S - 120) })])).toBe('ok')
	})

	test('an expired token is rejected', async () => {
		expect(await failedStep(await issuer.sign(claims({ iat: NOW_S - 300, exp: NOW_S - 60 })))).toBe('lifetime')
	})
})

describe('conditions', () => {
	test('a mismatch reports the condition index and the actual value', async () => {
		const row = trustRow({ conditions: [{ claim: 'sub', equals: 'web-backend' }, { path: ['ctx', 'env'], in: ['prod'] }] })
		const result = await check(await issuer.sign(claims({ ctx: { env: 'staging' } })), [row])
		expect(result.ok ? null : result.failure).toMatchObject({ step: 'condition', conditionIndex: 1, actualValue: 'staging' })
	})

	test('a successful check returns the trust and the verified claims', async () => {
		const result = await check(await issuer.sign(claims()))
		expect(result.ok && result.claims.sub).toBe('web-backend')
		expect(result.trust?.slug).toBe('web-backend')
	})
})

const bearer = (token: string, overrides: Partial<WorkloadAuthRequest> = {}): WorkloadAuthRequest => ({
	token,
	scheme: 'Bearer',
	dpopProofs: [],
	method: 'POST',
	url: URL_,
	...overrides,
})

const authenticate = async (
	ctx: ReturnType<typeof createVerifier>,
	request: WorkloadAuthRequest,
	rows: TrustDbRow[] = [trustRow()],
) => {
	const queries = [trustLookup(issuer.issuer, [AUDIENCE], rows)]
	const db = createDb(queries, NOW)
	const result = await ctx.verifier.authenticate({ read: db, write: db }, request, { ip: '203.0.113.1', userAgent: 'test' })
	expect(queries).toHaveLength(0)
	return result
}

describe('authenticate', () => {
	test('success returns the trust identity and a workload credential, and logs the token once', async () => {
		const ctx = createVerifier()
		const token = await issuer.sign(claims())
		const result = await authenticate(ctx, bearer(token), [trustRow({ roles: ['project_admin'], trust_forwarded_info: true })])
		expect(result.ok && result.result).toMatchObject({
			identityId: 'identity-1',
			credential: { type: 'workload_trust', trustId: 'trust-1', trustSlug: 'web-backend', tokenRef: 'token-1' },
			roles: ['project_admin'],
			personId: null,
			trustForwardedInfo: true,
		})
		await authenticate(ctx, bearer(token))
		await settle()
		expect(ctx.authLog.entries).toHaveLength(1)
		expect(ctx.authLog.entries[0]).toMatchObject({
			success: true,
			trustId: 'trust-1',
			identityId: 'identity-1',
			tokenRef: 'token-1',
			ipAddress: '203.0.113.1',
			eventData: { trustSlug: 'web-backend', iss: issuer.issuer, sub: 'web-backend', jti: 'token-1' },
		})
		expect(ctx.outcomes).toEqual(['success', 'success'])
	})

	test('a token without jti gets a sha256 token reference', async () => {
		const token = await issuer.sign(claims({ jti: undefined }))
		const result = await authenticate(createVerifier(), bearer(token))
		const expected = `sha256:${createHash('sha256').update(token).digest('hex')}`
		expect(result.ok && result.result.credential).toMatchObject({ type: 'workload_trust', tokenRef: expected })
	})

	test('failures are logged with unverified claims only, through a per-trust token bucket', async () => {
		const ctx = createVerifier()
		const token = await issuer.sign(claims({ sub: 'intruder' }))
		for (let i = 0; i < 12; i++) {
			const result = await authenticate(ctx, bearer(token))
			expect(result.ok ? null : result.error).toBe('condition')
		}
		await settle()
		expect(ctx.authLog.entries).toHaveLength(10)
		const entry = ctx.authLog.entries[0]
		expect(entry).toMatchObject({ success: false, trustId: 'trust-1', errorCode: 'condition' })
		const metadata: Record<string, JSONValue> = entry.metadata
		expect(metadata).toEqual({
			trustSlug: 'web-backend',
			unverified_iss: issuer.issuer,
			unverified_aud: AUDIENCE,
			unverified_sub: 'intruder',
			unverified_jti: 'token-1',
		})
		expect(entry.tokenRef).toBeUndefined()
		expect(ctx.outcomes).toHaveLength(12)
	})
})

describe('DPoP', () => {
	let clientKey: CryptoKey
	let clientJwk: JWK
	let jkt: string

	beforeAll(async () => {
		const pair = await generateKeyPair('ES256', { extractable: true })
		clientKey = pair.privateKey
		clientJwk = await exportJWK(pair.publicKey)
		jkt = await calculateJwkThumbprint(clientJwk)
	})

	const ath = (token: string) => createHash('sha256').update(token).digest('base64url')

	let proofCounter = 0
	const proof = async (
		token: string,
		overrides: JWTPayload = {},
		key: { privateKey: CryptoKey; jwk: JWK } = { privateKey: clientKey, jwk: clientJwk },
	) =>
		await new SignJWT({ htm: 'POST', htu: URL_, ath: ath(token), iat: NOW_S, jti: `proof-${++proofCounter}`, ...overrides })
			.setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk: key.jwk })
			.sign(key.privateKey)

	const boundToken = () => issuer.sign(claims({ cnf: { jkt } }))

	const dpopError = async (request: WorkloadAuthRequest, rows?: TrustDbRow[], ctx = createVerifier()) => {
		const result = await authenticate(ctx, request, rows)
		return result.ok ? 'ok' : result.error
	}

	test('a bound token with a valid proof is accepted', async () => {
		const token = await boundToken()
		expect(await dpopError(bearer(token, { scheme: 'DPoP', dpopProofs: [await proof(token)] }))).toBe('ok')
	})

	test('a bound token presented as Bearer is rejected', async () => {
		const token = await boundToken()
		expect(await dpopError(bearer(token, { dpopProofs: [await proof(token)] }))).toBe('dpop_binding')
		expect(await dpopError(bearer(token))).toBe('dpop_binding')
	})

	test('a bound token on a trust without requireDpop still needs a proof', async () => {
		expect(await dpopError(bearer(await boundToken(), { scheme: 'DPoP' }))).toBe('dpop_missing')
	})

	test('requireDpop rejects an unbound token', async () => {
		expect(await dpopError(bearer(await issuer.sign(claims())), [trustRow({ require_dpop: true })])).toBe('dpop_binding')
	})

	test('the DPoP scheme with an unbound token is rejected', async () => {
		const token = await issuer.sign(claims())
		expect(await dpopError(bearer(token, { scheme: 'DPoP', dpopProofs: [await proof(token)] }))).toBe('dpop_binding')
	})

	test('an unsupported cnf is never accepted', async () => {
		const token = await issuer.sign(claims({ cnf: { 'x5t#S256': 'abc' } }))
		expect(await dpopError(bearer(token))).toBe('dpop_binding')
	})

	test('wrong htm, htu or ath is rejected', async () => {
		const token = await boundToken()
		const dpop = (proofs: string[]) => bearer(token, { scheme: 'DPoP', dpopProofs: proofs })
		expect(await dpopError(dpop([await proof(token, { htm: 'GET' })]))).toBe('dpop_invalid')
		expect(await dpopError(dpop([await proof(token, { htu: 'https://api.example.com/content/other/live' })]))).toBe('dpop_invalid')
		expect(await dpopError(dpop([await proof(token, { ath: ath('another-token') })]))).toBe('dpop_invalid')
	})

	test('a proof htu differing only in query and fragment matches', async () => {
		const token = await boundToken()
		expect(await dpopError(bearer(token, { scheme: 'DPoP', dpopProofs: [await proof(token, { htu: `${URL_}?a=1#x` })] }))).toBe('ok')
	})

	test('a proof signed by another key fails the thumbprint check', async () => {
		const token = await boundToken()
		const other = await generateKeyPair('ES256', { extractable: true })
		const otherProof = await proof(token, {}, { privateKey: other.privateKey, jwk: await exportJWK(other.publicKey) })
		expect(await dpopError(bearer(token, { scheme: 'DPoP', dpopProofs: [otherProof] }))).toBe('dpop_binding')
	})

	test('a replayed proof is rejected', async () => {
		const ctx = createVerifier()
		const token = await boundToken()
		const request = bearer(token, { scheme: 'DPoP', dpopProofs: [await proof(token)] })
		expect(await dpopError(request, undefined, ctx)).toBe('ok')
		expect(await dpopError(request, undefined, ctx)).toBe('dpop_replay')
	})

	test('a stale proof iat is rejected', async () => {
		const token = await boundToken()
		expect(await dpopError(bearer(token, { scheme: 'DPoP', dpopProofs: [await proof(token, { iat: NOW_S - 120 })] }))).toBe('dpop_invalid')
		expect(await dpopError(bearer(token, { scheme: 'DPoP', dpopProofs: [await proof(token, { iat: NOW_S + 120 })] }))).toBe('dpop_invalid')
	})

	test('a proof without jti is rejected', async () => {
		const token = await boundToken()
		expect(await dpopError(bearer(token, { scheme: 'DPoP', dpopProofs: [await proof(token, { jti: undefined })] }))).toBe('dpop_invalid')
	})

	test('two DPoP headers are rejected', async () => {
		const token = await boundToken()
		expect(await dpopError(bearer(token, { scheme: 'DPoP', dpopProofs: [await proof(token), await proof(token)] }))).toBe('dpop_invalid')
	})

	test('a proof with a symmetric or disallowed alg is rejected', async () => {
		const token = await boundToken()
		const hsProof = await new SignJWT({ htm: 'POST', htu: URL_, ath: ath(token), iat: NOW_S, jti: 'hs' })
			.setProtectedHeader({ alg: 'HS256', typ: 'dpop+jwt' })
			.sign(new TextEncoder().encode('x'.repeat(32)))
		expect(await dpopError(bearer(token, { scheme: 'DPoP', dpopProofs: [hsProof] }))).toBe('dpop_invalid')
		const esOnlyRs = [trustRow({ signing_algs: ['RS256'] })]
		expect(await dpopError(bearer(token, { scheme: 'DPoP', dpopProofs: [await proof(token)] }), esOnlyRs)).toBe('dpop_invalid')
	})
})
