import { CredentialsProvider } from '@contember/graphql-client'
import { exportJWK, generateKeyPair, JWK } from 'jose'
import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { issuerHandler } from './issuerHandler.js'
import { signCompactJws } from './jws.js'
import { selfIssued } from './selfIssued.js'

export interface TestIssuerOptions {
	/** Signing algorithm of the issuer key (default `RS256`). */
	readonly alg?: 'RS256' | 'ES256'
	/** Host name in the issuer URL (default `localhost`); the server always listens on loopback. */
	readonly hostname?: string
}

export interface TestIssuerMintOptions {
	/** Overrides or removes (`undefined`) protected header members, e.g. `{ typ: undefined }`. */
	readonly header?: Readonly<Record<string, unknown>>
	/** Sign with a key the JWKS does not publish (same `kid`, so verification fails on the signature). */
	readonly foreignKey?: boolean
}

export interface TestIssuer {
	/** `http://<hostname>:<port>`; serves discovery and the JWKS. */
	readonly issuer: string
	readonly jwksUri: string
	/** Signs exactly these claims (nothing is added), for crafting valid and invalid tokens. */
	mint(claims: Readonly<Record<string, unknown>>, options?: TestIssuerMintOptions): Promise<string>
	/** A `selfIssued` provider signing with this issuer's key. */
	credentials(
		options: { readonly subject: string; readonly audience: string; readonly lifetime?: number; readonly dpop?: boolean },
	): CredentialsProvider
	close(): Promise<void>
}

/** A key plus discovery and JWKS on a random loopback port, for engine e2e and adopters' tests. */
export const createTestIssuer = async (options: TestIssuerOptions = {}): Promise<TestIssuer> => {
	const alg = options.alg ?? 'RS256'
	const kid = `test-${crypto.randomUUID()}`
	const { privateKey, publicKey } = await generateKeyPair(alg)
	const publicJwk: JWK = { ...await exportJWK(publicKey), kid, alg, use: 'sig' }
	let foreignKey: Promise<CryptoKey> | undefined

	const server = createServer()
	await new Promise<void>((resolve, reject) => {
		server.once('error', reject)
		server.listen(0, '127.0.0.1', () => {
			server.off('error', reject)
			resolve()
		})
	})
	const address = server.address()
	if (address === null || typeof address === 'string') {
		server.close()
		throw new Error('createTestIssuer: the server has no TCP address.')
	}
	const issuer = `http://${options.hostname ?? 'localhost'}:${address.port}`
	const handle = issuerHandler({ issuer, keys: [publicJwk] })
	server.on('request', (req: IncomingMessage, res: ServerResponse) => {
		handle(new Request(new URL(req.url ?? '/', issuer), { method: req.method }))
			.then(async response => {
				res.writeHead(response.status, Object.fromEntries(response.headers))
				res.end(await response.text())
			})
			.catch((error: unknown) => {
				res.writeHead(500)
				res.end(String(error))
			})
	})

	return {
		issuer,
		jwksUri: `${issuer}/.well-known/jwks.json`,
		mint: async (claims, mintOptions = {}) => {
			const signer = mintOptions.foreignKey ? await (foreignKey ??= generateKeyPair(alg).then(it => it.privateKey)) : privateKey
			return await signCompactJws({ alg, kid, typ: 'JWT', ...mintOptions.header }, claims, signer)
		},
		credentials: credentialsOptions => selfIssued({ ...credentialsOptions, issuer, signer: privateKey, alg, kid }),
		close: () =>
			new Promise<void>((resolve, reject) => {
				server.close(error => error ? reject(error) : resolve())
				server.closeAllConnections()
			}),
	}
}
