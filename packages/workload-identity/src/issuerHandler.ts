import { JWK } from 'jose'

export interface IssuerHandlerOptions {
	readonly issuer: string
	/** Public JWKs (each with `kid` and `alg`) currently published; private members are rejected. */
	readonly keys: readonly JWK[]
}

const privateJwkMembers: readonly string[] = ['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth', 'k']

/** Short, so a published rotation key reaches verifiers well within a token lifetime. */
const cacheControl = 'public, max-age=300'

/**
 * A fetch-style handler serving `{issuer path}/.well-known/openid-configuration` and `{issuer path}/.well-known/jwks.json`;
 * other paths answer 404. Throws at construction on an invalid issuer or a key with private members.
 */
export const issuerHandler = (options: IssuerHandlerOptions): (request: Request) => Promise<Response> => {
	const issuerUrl = new URL(options.issuer)
	if ((issuerUrl.protocol !== 'https:' && issuerUrl.protocol !== 'http:') || issuerUrl.search !== '' || issuerUrl.hash !== '') {
		throw new Error('issuerHandler: `issuer` must be an http(s) URL without query and fragment.')
	}
	const algorithms = new Set<string>()
	for (const key of options.keys) {
		const kid = typeof key.kid === 'string' && key.kid !== '' ? key.kid : undefined
		if (kid === undefined || typeof key.alg !== 'string' || key.alg === '' || typeof key.kty !== 'string') {
			throw new Error('issuerHandler: every key needs `kty`, `kid` and `alg`.')
		}
		const privateMembers = privateJwkMembers.filter(member => Object.prototype.hasOwnProperty.call(key, member))
		if (privateMembers.length > 0) {
			throw new Error(`issuerHandler: key "${kid}" has private members (${privateMembers.join(', ')}); publish public keys only.`)
		}
		algorithms.add(key.alg)
	}

	const basePath = issuerUrl.pathname.replace(/\/+$/, '')
	const discoveryPath = `${basePath}/.well-known/openid-configuration`
	const jwksPath = `${basePath}/.well-known/jwks.json`
	const documents = new Map([
		[
			discoveryPath,
			JSON.stringify({
				issuer: options.issuer,
				jwks_uri: new URL(jwksPath, issuerUrl).href,
				response_types_supported: ['id_token'],
				subject_types_supported: ['public'],
				id_token_signing_alg_values_supported: [...algorithms],
			}),
		],
		[jwksPath, JSON.stringify({ keys: options.keys })],
	])

	return async request => {
		const document = documents.get(new URL(request.url).pathname)
		if (document === undefined) {
			return new Response('Not Found', { status: 404 })
		}
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } })
		}
		return new Response(request.method === 'HEAD' ? null : document, {
			status: 200,
			headers: { 'Content-Type': 'application/json', 'Cache-Control': cacheControl },
		})
	}
}
