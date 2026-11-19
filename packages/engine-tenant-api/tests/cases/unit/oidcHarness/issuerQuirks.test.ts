import { afterEach, describe, expect, test } from 'bun:test'
import { EgressGuard, EgressPolicy } from '@contember/engine-common'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { FakeIdp, FakeIdpOptions } from './FakeIdp.js'
import { configurationFor, signIn } from './harness.js'

/**
 * Pins how discovery and ID-token issuer validation treat IdPs whose `issuer` differs from the configured URL:
 * trailing slashes, path-based realms and templated multi-tenant issuers.
 */
describe('OIDC issuer quirks', () => {
	const started: FakeIdp[] = []
	const start = async (options: FakeIdpOptions) => {
		const idp = await FakeIdp.start(options)
		started.push(idp)
		return idp
	}

	afterEach(async () => {
		for (const idp of started.splice(0)) {
			await idp.stop()
		}
	})

	test('a realm path: discovery is appended to the configured URL, with or without its trailing slash', async () => {
		const idp = await start({ basePath: '/realms/main' })

		for (const url of [idp.baseUrl, `${idp.baseUrl}/`]) {
			const { response } = await signIn(new OIDCProvider(null, null), configurationFor(idp, { url }), idp)
			expect(response.externalIdentifier).toBe('user-1')
		}
		expect(idp.requestsTo('discovery').map(it => it.path)).toEqual([
			'/realms/main/.well-known/openid-configuration',
			'/realms/main/.well-known/openid-configuration',
		])
	})

	test('a configured URL that is the discovery document itself is fetched as is', async () => {
		const idp = await start({ basePath: '/tenant' })

		const { response } = await signIn(new OIDCProvider(null, null), configurationFor(idp, { url: idp.endpointUrl('discovery') }), idp)

		expect(response.externalIdentifier).toBe('user-1')
		expect(idp.requestsTo('discovery').map(it => it.path)).toEqual(['/tenant/.well-known/openid-configuration'])
	})

	test('an issuer with a trailing slash the configured URL lacks: discovery accepts it, tokens must carry it exactly', async () => {
		const idp = await start({ issuer: base => `${base}/` })

		const { response } = await signIn(new OIDCProvider(null, null), configurationFor(idp), idp)

		expect(response.iss).toBe(`${idp.baseUrl}/`)
	})

	test('an issuer with a trailing slash, tokens without it: refused as an unexpected iss', async () => {
		const idp = await start({ issuer: base => `${base}/`, idTokenIssuer: base => base })

		const promise = signIn(new OIDCProvider(null, null), configurationFor(idp), idp)

		await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
		await expect(promise).rejects.toThrow(`unexpected iss value, expected ${idp.baseUrl}/, got: ${idp.baseUrl}`)
	})

	test('an issuer unrelated to the discovery URL: accepted, discovery does not compare them', async () => {
		const idp = await start({ issuer: () => 'https://issuer.example.com/tenant-a' })

		const { response } = await signIn(new OIDCProvider(null, null), configurationFor(idp), idp)

		expect(response.iss).toBe('https://issuer.example.com/tenant-a')
	})

	test('a {tenantid} template outside the Microsoft discovery URLs is compared literally: refused', async () => {
		const idp = await start({
			basePath: '/common/v2.0',
			issuer: base => `${new URL(base).origin}/{tenantid}/v2.0`,
			idTokenIssuer: base => `${new URL(base).origin}/tenant-a/v2.0`,
			idTokenClaims: { tid: 'tenant-a' },
		})

		const promise = signIn(new OIDCProvider(null, null), configurationFor(idp), idp)

		await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
		await expect(promise).rejects.toThrow(`unexpected iss value, expected ${new URL(idp.baseUrl).origin}/{tenantid}/v2.0`)
	})

	test('a back-channel logout token is checked against the advertised issuer, trailing slash included', async () => {
		const idp = await start({ issuer: base => `${base}/` })
		// without a guard, jose fetches the JWKS with the global fetch, which the test preload replaces with happy-dom's
		const guard = new EgressGuard(new EgressPolicy({ allowHttp: true, allowlist: ['localhost'] }))
		try {
			const provider = new OIDCProvider(guard, null)

			expect(await provider.validateLogoutToken(configurationFor(idp), await idp.signLogoutToken())).toEqual({ sid: 'idp-session-1', sub: 'user-1' })
			const mismatched = provider.validateLogoutToken(configurationFor(idp), await idp.signLogoutToken({ iss: idp.baseUrl }))
			await expect(mismatched).rejects.toBeInstanceOf(IDPValidationError)
			await expect(mismatched).rejects.toThrow('unexpected "iss" claim value')
		} finally {
			guard.dispose()
		}
	})
})
