import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http'
import { AddressInfo } from 'node:net'
import { CryptoKey, exportJWK, generateKeyPair, JWK, JWTPayload, SignJWT } from 'jose'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { DatabaseContext, Providers, WorkloadIdentity } from '../../../../../src/index.js'

export type Handler = (req: IncomingMessage, res: ServerResponse) => void

/** A loopback HTTP server whose handler a test can swap. */
export class TestServer {
	public handler: Handler = (_req, res) => {
		res.statusCode = 404
		res.end()
	}
	public connections = 0

	private constructor(private readonly server: Server, public readonly port: number) {}

	static async start(): Promise<TestServer> {
		let instance: TestServer | undefined
		const server = createServer((req, res) => instance?.handler(req, res))
		await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
		const address = server.address()
		if (address === null || typeof address === 'string') {
			throw new Error('no port')
		}
		const port: AddressInfo['port'] = address.port
		instance = new TestServer(server, port)
		const started = instance
		server.on('connection', () => {
			started.connections++
		})
		return instance
	}

	async stop(): Promise<void> {
		this.server.closeAllConnections()
		await new Promise<void>(resolve => this.server.close(() => resolve()))
	}
}

export const json = (res: ServerResponse, body: unknown, status = 200) => {
	res.statusCode = status
	res.setHeader('content-type', 'application/json')
	res.end(JSON.stringify(body))
}

export interface IssuerKey {
	readonly kid: string
	readonly alg: string
	readonly privateKey: CryptoKey
	readonly publicJwk: JWK
}

export const createIssuerKey = async (kid: string, alg = 'RS256'): Promise<IssuerKey> => {
	const { privateKey, publicKey } = await generateKeyPair(alg, { extractable: true })
	return { kid, alg, privateKey, publicJwk: { ...await exportJWK(publicKey), kid, alg, use: 'sig' } }
}

/** A self-hosted issuer on loopback: discovery document plus JWKS, keys swappable. */
export class TestIssuer {
	public keys: IssuerKey[] = []
	public available = true
	public jwksRequests = 0

	private constructor(public readonly server: TestServer) {
		server.handler = (req, res) => {
			if (!this.available) {
				res.statusCode = 503
				res.end()
				return
			}
			if (req.url === '/.well-known/openid-configuration') {
				json(res, { issuer: this.issuer, jwks_uri: `${this.issuer}/jwks.json` })
				return
			}
			if (req.url === '/jwks.json') {
				this.jwksRequests++
				json(res, { keys: this.keys.map(it => it.publicJwk) })
				return
			}
			res.statusCode = 404
			res.end()
		}
	}

	static async start(): Promise<TestIssuer> {
		const issuer = new TestIssuer(await TestServer.start())
		issuer.keys = [await createIssuerKey('key-1')]
		return issuer
	}

	get issuer(): string {
		return `http://localhost:${this.server.port}`
	}

	async sign(
		payload: JWTPayload,
		options: { key?: IssuerKey; typ?: string | null; kid?: string } = {},
	): Promise<string> {
		const key = options.key ?? this.keys[0]
		const typ = options.typ === undefined ? 'JWT' : options.typ
		return await new SignJWT(payload)
			.setProtectedHeader({ alg: key.alg, kid: options.kid ?? key.kid, ...(typ === null ? {} : { typ }) })
			.sign(key.privateKey)
	}

	async stop(): Promise<void> {
		await this.server.stop()
	}
}

export const instanceConfig: WorkloadIdentity.InstanceConfig = {
	...WorkloadIdentity.defaultInstanceConfig,
	insecureIssuers: ['localhost', '127.0.0.1'],
}

export const testProviders = (now: Date): Providers => ({
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => now,
	randomBytes: () => Promise.resolve(Buffer.alloc(0)),
	uuid: () => '00000000-0000-0000-0000-000000000001',
	decrypt: () => {
		throw new Error('not supported')
	},
	encrypt: () => {
		throw new Error('not supported')
	},
	encryptionEnabled: false,
	hash: () => Buffer.alloc(0),
})

export interface TrustDbRow {
	id: string
	slug: string
	identity_id: string
	issuer: string
	audience: string
	profile: string
	jwks_uri: string | null
	signing_algs: string[]
	accepted_typ: (string | null)[]
	accept_audience_array: boolean
	require_dpop: boolean
	conditions: unknown
	max_token_lifetime_seconds: number
	tokens_valid_after_epoch: string
	trust_forwarded_info: boolean
	disabled: boolean
	description: string | null
	roles: unknown
}

export const trustLookupSql =
	`select "workload_identity_trust"."id", "workload_identity_trust"."slug", "workload_identity_trust"."identity_id", "workload_identity_trust"."issuer", "workload_identity_trust"."audience", "workload_identity_trust"."profile", "workload_identity_trust"."jwks_uri", "workload_identity_trust"."signing_algs", "workload_identity_trust"."accepted_typ", "workload_identity_trust"."accept_audience_array", "workload_identity_trust"."require_dpop", "workload_identity_trust"."conditions", "workload_identity_trust"."max_token_lifetime_seconds", extract(epoch from "workload_identity_trust"."tokens_valid_after") as "tokens_valid_after_epoch", "workload_identity_trust"."trust_forwarded_info", "workload_identity_trust"."disabled_at" IS NOT NULL as "disabled", "identity"."description", "identity"."roles"
	from "tenant"."workload_identity_trust" inner join "tenant"."identity" as "identity" on "identity"."id" = "workload_identity_trust"."identity_id"
	where "workload_identity_trust"."issuer" = ? and "workload_identity_trust"."audience" in (__AUDIENCES__) and "workload_identity_trust"."disabled_at" is null`

/** The trust lookup the verifier must issue for `(issuer, audiences)`, answered with `rows`. */
export const trustLookup = (issuer: string, audiences: readonly string[], rows: readonly TrustDbRow[]): ExpectedQuery => ({
	sql: trustLookupSql.replace('__AUDIENCES__', audiences.map(() => '?').join(', ')),
	parameters: [issuer, ...audiences],
	response: { rows: [...rows], rowCount: rows.length },
})

export const createDb = (queries: ExpectedQuery[], now: Date): DatabaseContext => {
	const connection = createConnectionMock(queries)
	return new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), testProviders(now))
}
