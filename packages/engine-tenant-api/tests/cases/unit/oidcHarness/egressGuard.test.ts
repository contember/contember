import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { EgressError, EgressFetch, EgressGuard, EgressHttpOptions, EgressPolicy } from '@contember/engine-common'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'
import { IDPSessionState } from '../../../../src/model/service/idp/IdentityProviderHandler.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { OIDCConfiguration } from '../../../../src/model/service/idp/providers/OIDCTypes.js'
import { FakeIdp, FakeIdpEndpoint } from './FakeIdp.js'
import { configurationFor, signIn, startSignIn } from './harness.js'

/** The real guard, recording every URL it is asked to check. */
class RecordingEgressGuard extends EgressGuard {
	public readonly checked: string[] = []
	private readonly inner: EgressGuard

	constructor(policy: EgressPolicy) {
		super(policy)
		this.inner = new EgressGuard(policy)
	}

	override httpOptions(url: URL): EgressHttpOptions {
		this.checked.push(url.href)
		return this.inner.httpOptions(url)
	}

	override readonly fetch: EgressFetch = async (url, init) => {
		this.checked.push(url)
		return await this.inner.fetch(url, init)
	}

	override dispose(): void {
		this.inner.dispose()
		super.dispose()
	}
}

/** Without a path or query: what identifies the endpoint a request went to. */
const target = (href: string): string => {
	const url = new URL(href)
	return `${url.hostname}:${url.port}${url.pathname}`
}

/** Allow-listed by address; Linux routes all of 127.0.0.0/8 to the loopback interface. */
const ALLOWED_HOST = '127.0.0.2'

/**
 * The fake IdP is served as `127.0.0.2` (allow-listed) and also answers as `localhost`, which passes the URL check
 * and is refused only when the guard's lookup resolves it, so moving one endpoint there shows its request is guarded.
 */
describe('OIDCProvider outbound requests and the egress guard', () => {
	let idp: FakeIdp
	const guards: RecordingEgressGuard[] = []
	const guarded = () => {
		const guard = new RecordingEgressGuard(new EgressPolicy({ allowHttp: true, allowlist: [ALLOWED_HOST] }))
		guards.push(guard)
		return guard
	}

	beforeAll(async () => {
		idp = await FakeIdp.start({ hostname: ALLOWED_HOST })
	})
	afterAll(async () => {
		for (const guard of guards) {
			guard.dispose()
		}
		await idp.stop()
	})
	beforeEach(() => {
		idp.reset()
	})

	const configuration = (overrides: Partial<OIDCConfiguration> = {}) => configurationFor(idp, { fetchUserInfo: true, ...overrides })

	/** A session captured at sign-in with every endpoint allowed, for the revalidation steps. */
	const capturedSession = async (): Promise<IDPSessionState> => {
		const { response } = await signIn(new OIDCProvider(guarded(), null), configuration({ revalidation: { enabled: true } }), idp)
		if (!response.idpSession) {
			throw new Error('expected a captured session')
		}
		idp.requests.length = 0
		return response.idpSession
	}

	test('with every endpoint allowed, each request the IdP receives went through the guard', async () => {
		const guard = guarded()
		const provider = new OIDCProvider(guard, null)
		const config = configuration({ revalidation: { enabled: true } })

		const { response } = await signIn(provider, config, idp)
		const session = response.idpSession ?? {}
		const refreshed = await provider.revalidate(config, session)
		const refreshedSession = refreshed.status === 'valid' ? refreshed.idpSession ?? session : session
		expect(refreshed.status).toBe('valid')
		expect(await provider.revalidate({ ...config, revalidation: { enabled: true, method: 'userinfo' } }, refreshedSession)).toMatchObject({
			status: 'valid',
		})
		expect(await provider.revalidate({ ...config, revalidation: { enabled: true, method: 'introspection' } }, refreshedSession)).toEqual({
			status: 'valid',
		})
		expect(await provider.validateLogoutToken(config, await idp.signLogoutToken())).toEqual({ sid: 'idp-session-1', sub: 'user-1' })

		// the browser, not the provider, talks to the authorization endpoint
		const received = idp.requests.filter(it => it.endpoint !== 'authorization')
		expect(received.map(it => it.endpoint)).toEqual([
			'discovery',
			'token',
			'jwks',
			'userinfo',
			'token',
			'userinfo',
			'userinfo',
			'introspection',
			'jwks',
		])
		expect(guard.checked.map(target)).toEqual(received.map(it => `${it.host}:${new URL(idp.baseUrl).port}${it.path}`))
	})

	/** The step fails with the guard's error (unwrapped, so a caller treats it as transient) and the IdP sees nothing. */
	const blocked = async (
		endpoint: FakeIdpEndpoint,
		step: (provider: OIDCProvider) => Promise<unknown>,
		errorClass: typeof EgressError | typeof IDPValidationError = EgressError,
	) => {
		idp.endpointHosts = { [endpoint]: 'localhost' }
		const provider = new OIDCProvider(guarded(), null)

		const promise = step(provider)

		await expect(promise).rejects.toBeInstanceOf(errorClass)
		await expect(promise).rejects.toThrow('localhost resolves to the non-public address')
		expect(idp.requestsTo(endpoint)).toEqual([])
	}

	test('discovery', async () => {
		const promise = startSignIn(new OIDCProvider(guarded(), null), configuration({ url: idp.baseUrl.replace(ALLOWED_HOST, 'localhost') }))

		await expect(promise).rejects.toBeInstanceOf(EgressError)
		await expect(promise).rejects.toThrow('localhost resolves to the non-public address')
		expect(idp.requests).toEqual([])
	})

	test('an IP-literal endpoint is refused by the URL check, before any lookup', async () => {
		idp.endpointHosts = { token: '127.0.0.1' }

		const promise = signIn(new OIDCProvider(guarded(), null), configuration(), idp)

		await expect(promise).rejects.toBeInstanceOf(EgressError)
		await expect(promise).rejects.toThrow('127.0.0.1 resolves to the non-public address 127.0.0.1')
		expect(idp.requestsTo('token')).toEqual([])
	})

	test('token endpoint, authorization code grant', async () => {
		await blocked('token', provider => signIn(provider, configuration(), idp))
	})

	test('JWKS, verifying the ID token at sign-in', async () => {
		await blocked('jwks', provider => signIn(provider, configuration(), idp))
		expect(idp.requestsTo('token')).toHaveLength(1)
	})

	test('userinfo at sign-in', async () => {
		await blocked('userinfo', provider => signIn(provider, configuration(), idp))
	})

	test('token endpoint, refresh grant', async () => {
		const session = await capturedSession()
		await blocked('token', provider => provider.revalidate(configuration({ revalidation: { enabled: true } }), session))
	})

	test('JWKS, verifying the refreshed ID token', async () => {
		const session = await capturedSession()
		await blocked('jwks', provider => provider.revalidate(configuration({ revalidation: { enabled: true } }), session))
		expect(idp.requestsTo('token')).toHaveLength(1)
	})

	test('userinfo revalidation', async () => {
		const session = await capturedSession()
		await blocked('userinfo', provider => provider.revalidate(configuration({ revalidation: { enabled: true, method: 'userinfo' } }), session))
	})

	test('introspection revalidation', async () => {
		const session = await capturedSession()
		await blocked(
			'introspection',
			provider => provider.revalidate(configuration({ revalidation: { enabled: true, method: 'introspection' } }), session),
		)
	})

	test('JWKS, verifying a back-channel logout token: the refusal is reported as an invalid token', async () => {
		const logoutToken = await idp.signLogoutToken()
		await blocked('jwks', provider => provider.validateLogoutToken(configuration(), logoutToken), IDPValidationError)
	})

	test('the end-session URL is built locally, without a request', async () => {
		const provider = new OIDCProvider(guarded(), null)

		const url = await provider.buildLogoutUrl(configuration(), { idToken: 'id-token', postLogoutRedirectUri: 'https://app.example.com/bye' })

		expect(url).toBe(
			`${
				idp.endpointUrl('end_session')
			}?post_logout_redirect_uri=https%3A%2F%2Fapp.example.com%2Fbye&client_id=${idp.client.clientId}&id_token_hint=id-token`,
		)
		expect(idp.endpointsHit()).toEqual(['discovery'])
	})
})
