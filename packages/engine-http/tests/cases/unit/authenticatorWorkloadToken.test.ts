import { describe, expect, test } from 'bun:test'
import { IncomingMessage } from 'node:http'
import { Socket } from 'node:net'
import {
	ApiKeyManager,
	DatabaseContext,
	VerifyErrorCode,
	VerifyResponse,
	VerifyResult,
	WorkloadAuthFailureCategory,
	WorkloadAuthHttpInfo,
	WorkloadAuthRequest,
	WorkloadTokenVerifier,
} from '@contember/engine-tenant-api'
import { Authenticator } from '../../../src/common/Authorizator.js'
import { HttpErrorResponse } from '../../../src/common/HttpResponse.js'
import { Timer } from '../../../src/application/index.js'
import { createUnusedTenantDatabaseContext } from '../../utils.js'

type WorkloadAuthResponse = Awaited<ReturnType<WorkloadTokenVerifier['authenticate']>>

const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ3ZWItYmFja2VuZCJ9.c2lnbmF0dXJl'
const proof = 'eyJ0eXAiOiJkcG9wK2p3dCJ9.eyJodG0iOiJQT1NUIn0.cHJvb2Y'

const createRequest = ({ headers, peer = '127.0.0.1', method = 'POST', url = '/content/blog/live?debug=1' }: {
	headers: readonly (readonly [string, string])[]
	peer?: string
	method?: string
	url?: string
}): IncomingMessage => {
	const socket = new Socket()
	Object.defineProperty(socket, 'remoteAddress', { value: peer })
	const request = new IncomingMessage(socket)
	// Bun's IncomingMessage does not keep the socket it was constructed with.
	request.socket = socket
	const parsedHeaders: Record<string, string> = {}
	for (const [name, value] of headers) {
		const key = name.toLowerCase()
		// Node keeps the first Authorization / Host and joins other duplicates.
		parsedHeaders[key] = parsedHeaders[key] === undefined || key === 'authorization' || key === 'host'
			? parsedHeaders[key] ?? value
			: `${parsedHeaders[key]}, ${value}`
	}
	request.headers = parsedHeaders
	request.rawHeaders = headers.flatMap(it => [...it])
	request.method = method
	request.url = url
	return request
}

const timer: Timer = (_name, cb) => cb()

const createHarness = ({ workloadResponse, apiKeyResponse, trustedProxies = [] }: {
	workloadResponse?: WorkloadAuthResponse
	apiKeyResponse?: VerifyResponse
	trustedProxies?: readonly string[]
} = {}) => {
	const write = createUnusedTenantDatabaseContext('write')
	const read = createUnusedTenantDatabaseContext('read')
	const workloadCalls: { db: { read: DatabaseContext; write: DatabaseContext }; request: WorkloadAuthRequest; httpInfo: WorkloadAuthHttpInfo }[] = []
	const apiKeyCalls: string[] = []
	const workloadTokenVerifier: Pick<WorkloadTokenVerifier, 'authenticate'> = {
		authenticate: async (db, request, httpInfo) => {
			workloadCalls.push({ db, request, httpInfo })
			return workloadResponse ?? { ok: false, error: 'trust_not_found', errorMessage: 'Trust not found' }
		},
	}
	const apiKeyManager: Pick<ApiKeyManager, 'verifyAndProlong'> = {
		verifyAndProlong: async (_db, _readDb, token) => {
			apiKeyCalls.push(token)
			return apiKeyResponse ?? {
				ok: true,
				result: new VerifyResult('api-key-identity', { type: 'api_key', id: 'api-key-1' }, [], null),
			}
		},
	}
	const authenticator = new Authenticator(write, read, apiKeyManager, workloadTokenVerifier, trustedProxies)
	return { authenticator, workloadCalls, apiKeyCalls, read, write }
}

const workloadResult = (trustForwardedInfo = false) =>
	new VerifyResult(
		'trust-identity',
		{ type: 'workload_trust', trustId: 'trust-1', trustSlug: 'web-backend', tokenRef: 'jti-1' },
		[],
		null,
		trustForwardedInfo,
	)

const expectHttpError = async (promise: Promise<unknown>): Promise<HttpErrorResponse> => {
	const error = await promise.then(() => undefined, (e: unknown) => e)
	if (!(error instanceof HttpErrorResponse)) {
		throw new Error(`Expected an HttpErrorResponse, got ${String(error)}`)
	}
	return error
}

describe('opaque tokens', () => {
	test('a Bearer opaque token goes to the api key path', async () => {
		const { authenticator, workloadCalls, apiKeyCalls } = createHarness()
		const request = createRequest({ headers: [['Authorization', 'Bearer abcdef0123456789'], ['Host', 'api.example.com']] })
		const result = await authenticator.authenticate({ request, timer, clientIp: '127.0.0.1' })
		expect(result?.identityId).toBe('api-key-identity')
		expect(apiKeyCalls).toStrictEqual(['abcdef0123456789'])
		expect(workloadCalls).toHaveLength(0)
	})

	test('an opaque failure keeps its specific message and sends no WWW-Authenticate', async () => {
		const { authenticator } = createHarness({
			apiKeyResponse: { ok: false, error: VerifyErrorCode.NOT_FOUND, errorMessage: 'API key not found' },
		})
		const request = createRequest({ headers: [['Authorization', 'Bearer abcdef0123456789']] })
		const error = await expectHttpError(authenticator.authenticate({ request, timer }))
		expect(error.code).toBe(401)
		expect(error.message).toBe('Authorization failure: API key not found')
		expect(error.headers).toBeUndefined()
	})

	test('an opaque token with the DPoP scheme is a format error', async () => {
		const { authenticator, workloadCalls, apiKeyCalls } = createHarness()
		const request = createRequest({ headers: [['Authorization', 'DPoP abcdef0123456789']] })
		const error = await expectHttpError(authenticator.authenticate({ request, timer }))
		expect(error.message).toBe('Authorization failure: invalid Authorization header format')
		expect(workloadCalls).toHaveLength(0)
		expect(apiKeyCalls).toHaveLength(0)
	})

	test('a token with two dots but other characters is not a JWT and fails as before', async () => {
		const { authenticator, workloadCalls } = createHarness()
		const request = createRequest({ headers: [['Authorization', 'Bearer a.b+c.d']] })
		const error = await expectHttpError(authenticator.authenticate({ request, timer }))
		expect(error.message).toBe('Authorization failure: invalid Authorization header format')
		expect(workloadCalls).toHaveLength(0)
	})

	test('an oversized Authorization header is refused before any verification', async () => {
		const { authenticator, workloadCalls, apiKeyCalls } = createHarness()
		const request = createRequest({ headers: [['Authorization', `Bearer ${'a'.repeat(8 * 1024)}.b.c`]] })
		const error = await expectHttpError(authenticator.authenticate({ request, timer }))
		expect(error.code).toBe(401)
		expect(workloadCalls).toHaveLength(0)
		expect(apiKeyCalls).toHaveLength(0)
	})
})

describe('JWT branch', () => {
	test('a Bearer JWT goes to the workload verifier with the request details', async () => {
		const { authenticator, workloadCalls, apiKeyCalls, read, write } = createHarness({ workloadResponse: { ok: true, result: workloadResult() } })
		const request = createRequest({
			headers: [['Authorization', `Bearer ${jwt}`], ['Host', 'api.example.com'], ['User-Agent', 'backend/1.0']],
		})
		const result = await authenticator.authenticate({ request, timer, clientIp: '198.51.100.4' })
		expect(result?.identityId).toBe('trust-identity')
		expect(result?.credential).toStrictEqual({ type: 'workload_trust', trustId: 'trust-1', trustSlug: 'web-backend', tokenRef: 'jti-1' })
		expect(apiKeyCalls).toHaveLength(0)
		expect(workloadCalls).toHaveLength(1)
		const [call] = workloadCalls
		expect(call.db.read).toBe(read)
		expect(call.db.write).toBe(write)
		expect(call.request).toStrictEqual({
			token: jwt,
			scheme: 'Bearer',
			dpopProofs: [],
			method: 'POST',
			url: 'http://api.example.com/content/blog/live',
		})
		expect(call.httpInfo).toStrictEqual({ ip: '198.51.100.4', userAgent: 'backend/1.0' })
	})

	test('the DPoP scheme is case-insensitive and passes the proof', async () => {
		const { authenticator, workloadCalls } = createHarness({ workloadResponse: { ok: true, result: workloadResult() } })
		const request = createRequest({ headers: [['Authorization', `dpop ${jwt}`], ['DPoP', proof], ['Host', 'api.example.com']] })
		await authenticator.authenticate({ request, timer })
		expect(workloadCalls[0].request.scheme).toBe('DPoP')
		expect(workloadCalls[0].request.dpopProofs).toStrictEqual([proof])
	})

	test('every DPoP header reaches the verifier, so a duplicate is detected', async () => {
		const { authenticator, workloadCalls } = createHarness({ workloadResponse: { ok: true, result: workloadResult() } })
		const request = createRequest({ headers: [['Authorization', `DPoP ${jwt}`], ['DPoP', proof], ['dpop', `${proof}x`]] })
		await authenticator.authenticate({ request, timer })
		expect(workloadCalls[0].request.dpopProofs).toStrictEqual([proof, `${proof}x`])
	})

	test('a verifier failure is the uniform 401 with a Bearer challenge', async () => {
		const { authenticator } = createHarness({ workloadResponse: { ok: false, error: 'condition', errorMessage: 'Condition #0 does not match' } })
		const request = createRequest({ headers: [['Authorization', `Bearer ${jwt}`]] })
		const error = await expectHttpError(authenticator.authenticate({ request, timer }))
		expect(error.code).toBe(401)
		expect(error.body).toBe(JSON.stringify({ errors: [{ code: 401, message: 'Authorization failure: invalid token' }] }))
		expect(error.headers).toStrictEqual({ 'WWW-Authenticate': 'Bearer error="invalid_token"' })
	})

	test('a verifier failure on a DPoP-scheme request answers with a DPoP challenge', async () => {
		const { authenticator } = createHarness({ workloadResponse: { ok: false, error: 'dpop_invalid', errorMessage: 'Proof signature is invalid' } })
		const request = createRequest({ headers: [['Authorization', `DPoP ${jwt}`], ['DPoP', proof]] })
		const error = await expectHttpError(authenticator.authenticate({ request, timer }))
		expect(error.message).toBe('Authorization failure: invalid token')
		expect(error.headers).toStrictEqual({ 'WWW-Authenticate': 'DPoP error="invalid_token"' })
	})

	test('different failure categories are indistinguishable outside', async () => {
		const categories: readonly WorkloadAuthFailureCategory[] = ['trust_not_found', 'signature', 'dpop_replay']
		const responses = await Promise.all(categories.map(async category => {
			const { authenticator } = createHarness({ workloadResponse: { ok: false, error: category, errorMessage: `detail of ${category}` } })
			const request = createRequest({ headers: [['Authorization', `Bearer ${jwt}`]] })
			const error = await expectHttpError(authenticator.authenticate({ request, timer }))
			return { code: error.code, body: error.body, headers: error.headers }
		}))
		expect(responses[1]).toStrictEqual(responses[0])
		expect(responses[2]).toStrictEqual(responses[0])
	})

	test('an oversized DPoP proof is the uniform 401 without verification', async () => {
		const { authenticator, workloadCalls } = createHarness({ workloadResponse: { ok: true, result: workloadResult() } })
		const request = createRequest({ headers: [['Authorization', `DPoP ${jwt}`], ['DPoP', 'a'.repeat(8 * 1024 + 1)]] })
		const error = await expectHttpError(authenticator.authenticate({ request, timer }))
		expect(error.message).toBe('Authorization failure: invalid token')
		expect(workloadCalls).toHaveLength(0)
	})

	test('forwarded proto and host form the URL when the peer is a trusted proxy', async () => {
		const { authenticator, workloadCalls } = createHarness({ workloadResponse: { ok: true, result: workloadResult() }, trustedProxies: ['10.0.0.0/8'] })
		const request = createRequest({
			peer: '10.1.2.3',
			headers: [
				['Authorization', `Bearer ${jwt}`],
				['Host', 'engine:4000'],
				['X-Forwarded-Proto', 'https'],
				['X-Forwarded-Host', 'api.example.com, internal-proxy'],
			],
		})
		await authenticator.authenticate({ request, timer })
		expect(workloadCalls[0].request.url).toBe('https://api.example.com/content/blog/live')
	})

	test('forwarded proto and host are ignored from an untrusted peer', async () => {
		const { authenticator, workloadCalls } = createHarness({ workloadResponse: { ok: true, result: workloadResult() }, trustedProxies: ['10.0.0.0/8'] })
		const request = createRequest({
			peer: '203.0.113.7',
			headers: [
				['Authorization', `Bearer ${jwt}`],
				['Host', 'engine:4000'],
				['X-Forwarded-Proto', 'https'],
				['X-Forwarded-Host', 'api.example.com'],
			],
		})
		await authenticator.authenticate({ request, timer })
		expect(workloadCalls[0].request.url).toBe('http://engine:4000/content/blog/live')
	})

	test('a private peer outside trustedProxies is not trusted for the URL either', async () => {
		const { authenticator, workloadCalls } = createHarness({ workloadResponse: { ok: true, result: workloadResult() } })
		const request = createRequest({
			peer: '192.168.1.10',
			headers: [['Authorization', `Bearer ${jwt}`], ['Host', 'engine:4000'], ['X-Forwarded-Host', 'api.example.com']],
		})
		await authenticator.authenticate({ request, timer })
		expect(workloadCalls[0].request.url).toBe('http://engine:4000/content/blog/live')
	})

	test('forwarded client info follows the trust flag from the verifier', async () => {
		const forwarded: readonly (readonly [string, string])[] = [['Authorization', `Bearer ${jwt}`], ['X-Contember-Client-Ip', '203.0.113.9']]
		const trusted = createHarness({ workloadResponse: { ok: true, result: workloadResult(true) } })
		const trustedResult = await trusted.authenticator.authenticate({ request: createRequest({ headers: forwarded }), timer, clientIp: '10.0.0.1' })
		expect(trustedResult?.clientIp).toBe('203.0.113.9')
		expect(trustedResult?.forwarderIp).toBe('10.0.0.1')

		const untrusted = createHarness({ workloadResponse: { ok: true, result: workloadResult(false) } })
		const untrustedResult = await untrusted.authenticator.authenticate({ request: createRequest({ headers: forwarded }), timer, clientIp: '10.0.0.1' })
		expect(untrustedResult?.clientIp).toBe('10.0.0.1')
		expect(untrustedResult?.forwarderIp).toBeUndefined()
	})
})
