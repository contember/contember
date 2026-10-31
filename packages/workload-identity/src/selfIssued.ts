import { CredentialsProvider, CredentialsRequest } from '@contember/graphql-client'
import { base64url, calculateJwkThumbprint, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { JwsSigner, resolveKeyAlgorithm, signCompactJws } from './jws.js'
import { TokenCache } from './TokenCache.js'

export interface SelfIssuedOptions {
	readonly issuer: string
	readonly subject: string
	readonly audience: string
	readonly signer: JwsSigner
	/** JWS algorithm, e.g. `ES256`; required when `signer` is a function, otherwise derived from the key. */
	readonly alg?: string
	readonly kid: string
	/** Token lifetime in seconds (default 300). */
	readonly lifetime?: number
	/** Bind tokens to an ephemeral non-extractable key and send a DPoP proof per request (RFC 9449). */
	readonly dpop?: boolean
	/** Extra claims; `iss` / `sub` / `aud` / `iat` / `exp` / `jti` / `cnf` cannot be overridden. */
	readonly claims?: Readonly<Record<string, unknown>>
}

const reservedClaims = ['iss', 'sub', 'aud', 'iat', 'exp', 'jti', 'cnf']

/**
 * Mints tokens in-process for a backend that is its own issuer: `Authorization: Bearer <token>`,
 * or with `dpop`, `Authorization: DPoP <token>` plus a fresh `DPoP` proof per request.
 */
export const selfIssued = (options: SelfIssuedOptions): CredentialsProvider => {
	const lifetime = options.lifetime ?? 300
	if (!Number.isInteger(lifetime) || lifetime <= 0) {
		throw new Error('selfIssued: `lifetime` must be a positive integer number of seconds.')
	}
	const alg = options.alg ?? (typeof options.signer === 'function' ? undefined : resolveKeyAlgorithm(options.signer))
	if (alg === undefined) {
		throw new Error('selfIssued: `alg` is required when it cannot be derived from the signer.')
	}
	const extraClaims = options.claims ?? {}
	const overridden = reservedClaims.filter(claim => claim in extraClaims)
	if (overridden.length > 0) {
		throw new Error(`selfIssued: claims ${overridden.join(', ')} are set by the provider and cannot be overridden.`)
	}

	let dpopKey: Promise<DpopKey> | undefined
	const getDpopKey = options.dpop ? () => dpopKey ??= createDpopKey() : undefined

	const cache = new TokenCache('selfIssued', async () => {
		const now = Math.floor(Date.now() / 1000)
		const cnf = getDpopKey !== undefined ? { jkt: (await getDpopKey()).thumbprint } : undefined
		return await signCompactJws(
			{ alg, kid: options.kid, typ: 'JWT' },
			{
				...extraClaims,
				iss: options.issuer,
				sub: options.subject,
				aud: options.audience,
				iat: now,
				exp: now + lifetime,
				jti: crypto.randomUUID(),
				...(cnf !== undefined ? { cnf } : {}),
			},
			options.signer,
		)
	})

	return {
		authenticate: async (request): Promise<Record<string, string>> => {
			const token = await cache.get(request.refresh)
			if (getDpopKey === undefined) {
				return { Authorization: `Bearer ${token}` }
			}
			return {
				Authorization: `DPoP ${token}`,
				DPoP: await createDpopProof(await getDpopKey(), token, request),
			}
		},
	}
}

interface DpopKey {
	readonly privateKey: CryptoKey
	readonly publicJwk: { readonly kty: string; readonly crv: string; readonly x: string; readonly y: string }
	readonly thumbprint: string
}

const createDpopKey = async (): Promise<DpopKey> => {
	const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: false })
	const { kty, crv, x, y } = await exportJWK(publicKey)
	if (kty === undefined || crv === undefined || x === undefined || y === undefined) {
		throw new Error('selfIssued: the DPoP public key could not be exported.')
	}
	const publicJwk = { kty, crv, x, y }
	return { privateKey, publicJwk, thumbprint: await calculateJwkThumbprint(publicJwk, 'sha256') }
}

const createDpopProof = async (key: DpopKey, token: string, request: CredentialsRequest): Promise<string> => {
	const htu = new URL(request.url)
	htu.search = ''
	htu.hash = ''
	const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
	return await new SignJWT({ htm: request.method, htu: htu.href, ath: base64url.encode(new Uint8Array(tokenHash)) })
		.setProtectedHeader({ typ: 'dpop+jwt', alg: 'ES256', jwk: key.publicJwk })
		.setIssuedAt()
		.setJti(crypto.randomUUID())
		.sign(key.privateKey)
}
