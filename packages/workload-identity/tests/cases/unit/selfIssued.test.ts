import { afterEach, describe, expect, setSystemTime, spyOn, test } from 'bun:test'
import {
	base64url,
	calculateJwkThumbprint,
	createLocalJWKSet,
	decodeJwt,
	decodeProtectedHeader,
	EmbeddedJWK,
	exportJWK,
	generateKeyPair,
	JSONWebKeySet,
	jwtVerify,
} from 'jose'
import { issuerHandler, selfIssued } from '../../../src/index.js'

const issuer = 'https://auth.example.com'
const audience = 'contember:my-instance:web-backend'
const request = { url: 'https://api.example.com/content/web/live?x=1#frag', method: 'POST', refresh: false }

afterEach(() => {
	setSystemTime()
})

const createIssuerKey = async (alg: 'ES256' | 'RS256') => {
	const { privateKey, publicKey } = await generateKeyPair(alg)
	const publicJwk = { ...await exportJWK(publicKey), kid: `${alg}-key`, alg }
	const handler = issuerHandler({ issuer, keys: [publicJwk] })
	const response = await handler(new Request(`${issuer}/.well-known/jwks.json`))
	const jwks: JSONWebKeySet = await response.json()
	return { privateKey, kid: publicJwk.kid, jwks: createLocalJWKSet(jwks) }
}

const bearerToken = (headers: Record<string, string>, scheme = 'Bearer') => {
	const [actualScheme, token] = headers.Authorization.split(' ')
	expect(actualScheme).toBe(scheme)
	return token
}

describe('selfIssued', () => {
	test('mints a token that verifies against the issuerHandler JWKS', async () => {
		const key = await createIssuerKey('ES256')
		const provider = selfIssued({ issuer, subject: 'web-backend', audience, signer: key.privateKey, kid: key.kid, claims: { tier: 'gold' } })

		const headers = await provider.authenticate(request)
		expect(Object.keys(headers)).toEqual(['Authorization'])
		const token = bearerToken(headers)

		const { payload, protectedHeader } = await jwtVerify(token, key.jwks, { issuer, audience, subject: 'web-backend', typ: 'JWT' })
		expect(protectedHeader).toEqual({ alg: 'ES256', kid: key.kid, typ: 'JWT' })
		expect(Object.keys(payload).sort()).toEqual(['aud', 'exp', 'iat', 'iss', 'jti', 'sub', 'tier'])
		expect(payload.exp).toBe(Number(payload.iat) + 300)
		expect(payload.tier).toBe('gold')
		expect(payload.cnf).toBeUndefined()
	})

	test('derives RS256 from an RSA key', async () => {
		const key = await createIssuerKey('RS256')
		const provider = selfIssued({ issuer, subject: 'web-backend', audience, signer: key.privateKey, kid: key.kid })
		const { protectedHeader } = await jwtVerify(bearerToken(await provider.authenticate(request)), key.jwks, { issuer, audience })
		expect(protectedHeader.alg).toBe('RS256')
	})

	test('signs through a raw-signature function', async () => {
		const key = await createIssuerKey('ES256')
		const signingInputs: string[] = []
		const provider = selfIssued({
			issuer,
			subject: 'web-backend',
			audience,
			alg: 'ES256',
			kid: key.kid,
			// WebCrypto ECDSA returns raw r‖s, like the function contract requires
			signer: async input => {
				signingInputs.push(new TextDecoder().decode(input))
				return new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key.privateKey, input))
			},
		})

		const token = bearerToken(await provider.authenticate(request))
		expect(signingInputs).toEqual([token.split('.').slice(0, 2).join('.')])
		const { protectedHeader } = await jwtVerify(token, key.jwks, { issuer, audience })
		expect(protectedHeader).toEqual({ alg: 'ES256', kid: key.kid, typ: 'JWT' })
	})

	test('caches the token until 80 % of its lifetime and mints a new one on refresh', async () => {
		const start = new Date('2026-01-01T00:00:00Z')
		setSystemTime(start)
		const key = await createIssuerKey('ES256')
		const provider = selfIssued({ issuer, subject: 'web-backend', audience, signer: key.privateKey, kid: key.kid, lifetime: 100 })

		const first = await provider.authenticate(request)
		setSystemTime(new Date(start.getTime() + 79_000))
		expect(await provider.authenticate(request)).toEqual(first)

		setSystemTime(new Date(start.getTime() + 81_000))
		const second = await provider.authenticate(request)
		expect(second).not.toEqual(first)
		expect(decodeJwt(bearerToken(second)).iat).toBe(Math.floor(start.getTime() / 1000) + 81)

		const third = await provider.authenticate({ ...request, refresh: true })
		expect(decodeJwt(bearerToken(third)).jti).not.toBe(decodeJwt(bearerToken(second)).jti)
	})

	test('rejects invalid options', async () => {
		const key = await createIssuerKey('ES256')
		const base = { issuer, subject: 'web-backend', audience, signer: key.privateKey, kid: key.kid }
		expect(() => selfIssued({ ...base, claims: { aud: 'other', cnf: {} } })).toThrow('aud, cnf')
		expect(() => selfIssued({ ...base, lifetime: 0 })).toThrow('lifetime')
		expect(() => selfIssued({ ...base, lifetime: 1.5 })).toThrow('lifetime')
		expect(() => selfIssued({ ...base, signer: async () => new Uint8Array() })).toThrow('`alg` is required')
		const hmacKey = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
		expect(() => selfIssued({ ...base, signer: hmacKey })).toThrow('`alg` is required')
	})

	describe('dpop', () => {
		test('binds the token to an ephemeral non-extractable key and sends a fresh proof per request', async () => {
			const generateKey = spyOn(crypto.subtle, 'generateKey')
			try {
				const key = await createIssuerKey('RS256')
				generateKey.mockClear()
				const provider = selfIssued({ issuer, subject: 'web-backend', audience, signer: key.privateKey, kid: key.kid, dpop: true })

				const first = await provider.authenticate(request)
				const second = await provider.authenticate({ ...request, method: 'GET' })
				expect(Object.keys(first).sort()).toEqual(['Authorization', 'DPoP'])

				expect(generateKey).toHaveBeenCalledTimes(1)
				const keyPair: unknown = await generateKey.mock.results[0].value
				expect(keyPair).toMatchObject({ privateKey: { extractable: false, algorithm: { name: 'ECDSA', namedCurve: 'P-256' } } })

				const token = bearerToken(first, 'DPoP')
				expect(bearerToken(second, 'DPoP')).toBe(token)
				const { payload } = await jwtVerify(token, key.jwks, { issuer, audience })

				const proofHeader = decodeProtectedHeader(first.DPoP)
				expect(proofHeader.typ).toBe('dpop+jwt')
				expect(proofHeader.alg).toBe('ES256')
				expect(Object.keys(proofHeader.jwk ?? {}).sort()).toEqual(['crv', 'kty', 'x', 'y'])
				expect(payload.cnf).toEqual({ jkt: await calculateJwkThumbprint(proofHeader.jwk ?? {}, 'sha256') })

				const tokenHash = base64url.encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))))
				const proof = await jwtVerify(first.DPoP, EmbeddedJWK, { typ: 'dpop+jwt', algorithms: ['ES256'] })
				expect(Object.keys(proof.payload).sort()).toEqual(['ath', 'htm', 'htu', 'iat', 'jti'])
				expect(proof.payload).toMatchObject({ htm: 'POST', htu: 'https://api.example.com/content/web/live', ath: tokenHash })

				const secondProof = await jwtVerify(second.DPoP, EmbeddedJWK, { typ: 'dpop+jwt' })
				expect(secondProof.payload.htm).toBe('GET')
				expect(secondProof.payload.jti).not.toBe(proof.payload.jti)
				expect(decodeProtectedHeader(second.DPoP).jwk).toEqual(proofHeader.jwk)
			} finally {
				generateKey.mockRestore()
			}
		})
	})
})
