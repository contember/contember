import { createHash, randomBytes } from 'node:crypto'
import http from 'node:http'
import { decodeProtectedHeader, exportJWK, generateKeyPair, JWK, JWTPayload, SignJWT } from 'jose'

/**
 * A fake OpenID Connect provider over real HTTP. It does not use `openid-client`, so the tests built on it keep
 * meaning the same thing when the library under the tenant IdP login is replaced.
 */

export type FakeIdpEndpoint = 'discovery' | 'jwks' | 'authorization' | 'token' | 'userinfo' | 'introspection' | 'end_session'

const ENDPOINTS: readonly FakeIdpEndpoint[] = ['discovery', 'jwks', 'authorization', 'token', 'userinfo', 'introspection', 'end_session']

const ENDPOINT_PATHS: Record<FakeIdpEndpoint, string> = {
	discovery: '/.well-known/openid-configuration',
	jwks: '/jwks',
	authorization: '/authorize',
	token: '/token',
	userinfo: '/userinfo',
	introspection: '/introspect',
	end_session: '/logout',
}

export interface FakeIdpOptions {
	/** Path prefix of every endpoint, e.g. `/realms/main`. Default none. */
	readonly basePath?: string
	/** The `issuer` the discovery document advertises, from the base URL (origin + basePath). Default the base URL. */
	readonly issuer?: (baseUrl: string) => string
	/** The `iss` put into ID tokens. Default the advertised issuer. */
	readonly idTokenIssuer?: (baseUrl: string) => string
	/** Extra claims in every ID token, e.g. a `tid`. */
	readonly idTokenClaims?: Readonly<Record<string, unknown>>
	/** Host the advertised URLs use. Default `localhost`. */
	readonly hostname?: string
}

export type FakeIdpOverride =
	| { readonly kind: 'respond'; readonly status: number; readonly headers?: Readonly<Record<string, string>>; readonly body?: string | object }
	/** Accept the request and never answer it. */
	| { readonly kind: 'hang' }

export interface FakeIdpRequest {
	readonly endpoint: FakeIdpEndpoint | null
	readonly method: string
	/** Host the request was addressed to, without the port. */
	readonly host: string
	readonly path: string
	readonly query: Readonly<Record<string, string>>
	readonly headers: Readonly<http.IncomingHttpHeaders>
	/** Parsed `application/x-www-form-urlencoded` body; empty for other bodies. */
	readonly form: Readonly<Record<string, string>>
}

/** Client authentication as the token, introspection and similar endpoints received it. */
export type FakeIdpClientAuth =
	| { readonly method: 'client_secret_basic'; readonly clientId: string; readonly clientSecret: string }
	| { readonly method: 'client_secret_post'; readonly clientId: string; readonly clientSecret: string }
	| { readonly method: 'client_secret_jwt' | 'private_key_jwt'; readonly clientId: string | undefined; readonly assertion: string }
	| { readonly method: 'none'; readonly clientId: string | undefined }

export interface FakeIdpClient {
	readonly clientId: string
	readonly clientSecret: string
}

interface AuthorizationGrant {
	readonly redirectUri: string
	readonly nonce: string | undefined
	readonly scope: string
}

interface RefreshGrant {
	readonly scope: string
	readonly nonce: string | undefined
}

/** Authorization endpoint result, read off the redirect the browser would follow. */
export interface FakeIdpAuthorization {
	/** The `Location` the IdP redirected to, or the form action for `form_post`. */
	readonly redirectTo: string
	/** Where the response parameters were placed. */
	readonly mode: 'query' | 'fragment' | 'form_post'
	readonly parameters: Record<string, string>
}

const DEFAULT_CLIENT: FakeIdpClient = { clientId: 'contember-client', clientSecret: 'contember-client-secret' }
const DEFAULT_USER = { sub: 'user-1', email: 'jane@example.com', email_verified: true, name: 'Jane Doe' }
const ACCESS_TOKEN_LIFETIME_SECONDS = 300

/** Left half of the SHA-256 digest, the `at_hash` / `c_hash` of an RS256 ID token (OIDC Core 3.1.3.6). */
const halfHash = (value: string): string => createHash('sha256').update(value).digest().subarray(0, 16).toString('base64url')

const randomToken = (prefix: string): string => `${prefix}-${randomBytes(12).toString('base64url')}`

/** `application/x-www-form-urlencoded` decoding, as client_secret_basic requires for both credential parts. */
const formDecode = (value: string): string => decodeURIComponent(value.replace(/\+/g, ' '))

const readBody = async (req: http.IncomingMessage): Promise<string> => {
	const chunks: Buffer[] = []
	for await (const chunk of req) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
	}
	return Buffer.concat(chunks).toString('utf8')
}

const htmlAttribute = (value: string): string => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export class FakeIdp {
	/** Every request received since the last {@link reset}, in arrival order. */
	public readonly requests: FakeIdpRequest[] = []
	/** Client authentication of every request to the token and introspection endpoints. */
	public readonly clientAuth: { readonly endpoint: FakeIdpEndpoint; readonly auth: FakeIdpClientAuth }[] = []

	/** The registered client. */
	public client: FakeIdpClient = DEFAULT_CLIENT
	/** Claims of the user who "signs in" at the authorization endpoint. */
	public user: Record<string, unknown> = { ...DEFAULT_USER }
	/** Extra claims the userinfo endpoint returns on top of {@link user}. */
	public userinfoClaims: Record<string, unknown> = {}
	/** `sid` put into ID tokens; none when undefined. */
	public sessionId: string | undefined = 'idp-session-1'
	/** Issue a new refresh token on every refresh grant (otherwise the response omits it). */
	public rotateRefreshTokens = true
	/** Return an ID token from the refresh grant. */
	public idTokenOnRefresh = true
	/** Issue a refresh token for the code grant even without `offline_access`. */
	public alwaysIssueRefreshToken = false
	/** Host per endpoint in the advertised URLs, overriding {@link FakeIdpOptions.hostname}. */
	public endpointHosts: Partial<Record<FakeIdpEndpoint, string>> = {}
	/** Endpoints left out of the discovery document. */
	public omittedEndpoints: FakeIdpEndpoint[] = []

	private readonly server: http.Server
	private readonly basePath: string
	private readonly hostname: string
	private port = 0
	private readonly overrides = new Map<FakeIdpEndpoint, FakeIdpOverride>()
	private readonly codes = new Map<string, AuthorizationGrant>()
	private readonly accessTokens = new Set<string>()
	private readonly refreshTokens = new Map<string, RefreshGrant>()
	private readonly hangingResponses = new Set<http.ServerResponse>()

	private constructor(
		private readonly options: FakeIdpOptions,
		private readonly keys: { readonly privateKey: CryptoKey; readonly publicJwk: JWK; readonly kid: string },
	) {
		this.basePath = options.basePath ?? ''
		this.hostname = options.hostname ?? 'localhost'
		const handler: http.RequestListener = (req, res) => {
			this.handle(req, res).catch(e => {
				res.writeHead(500, { 'content-type': 'text/plain' }).end(e instanceof Error ? e.message : String(e))
			})
		}
		this.server = http.createServer(handler)
	}

	static async start(options: FakeIdpOptions = {}): Promise<FakeIdp> {
		const { privateKey, publicKey } = await generateKeyPair('RS256')
		const kid = `key-${randomBytes(4).toString('hex')}`
		const publicJwk = { ...(await exportJWK(publicKey)), kid, alg: 'RS256', use: 'sig' }
		const idp = new FakeIdp(options, { privateKey, publicJwk, kid })
		// All interfaces: `localhost` may resolve to ::1 first.
		await new Promise<void>(resolve => idp.server.listen(0, resolve))
		const address = idp.server.address()
		if (address === null || typeof address === 'string') {
			throw new Error('expected a TCP address')
		}
		idp.port = address.port
		return idp
	}

	async stop(): Promise<void> {
		this.releaseHanging()
		this.server.closeAllConnections()
		await new Promise<void>(resolve => this.server.close(() => resolve()))
	}

	/** Forget recorded requests, issued grants and overrides, and restore the default user, client and quirks. */
	reset(): void {
		this.releaseHanging()
		this.requests.length = 0
		this.clientAuth.length = 0
		this.overrides.clear()
		this.codes.clear()
		this.accessTokens.clear()
		this.refreshTokens.clear()
		this.client = DEFAULT_CLIENT
		this.user = { ...DEFAULT_USER }
		this.userinfoClaims = {}
		this.sessionId = 'idp-session-1'
		this.rotateRefreshTokens = true
		this.idTokenOnRefresh = true
		this.alwaysIssueRefreshToken = false
		this.endpointHosts = {}
		this.omittedEndpoints = []
	}

	/** Origin plus base path, on the default host: what a provider configuration's `url` points at. */
	get baseUrl(): string {
		return this.urlOn(this.hostname)
	}

	/** The `issuer` of the discovery document. */
	get issuer(): string {
		return this.options.issuer ? this.options.issuer(this.baseUrl) : this.baseUrl
	}

	/** The `iss` of issued ID tokens. */
	get idTokenIssuer(): string {
		return this.options.idTokenIssuer ? this.options.idTokenIssuer(this.baseUrl) : this.issuer
	}

	/** Advertised URL of an endpoint. */
	endpointUrl(endpoint: FakeIdpEndpoint): string {
		return `${this.urlOn(this.endpointHosts[endpoint] ?? this.hostname)}${ENDPOINT_PATHS[endpoint]}`
	}

	/** Answer every request to `endpoint` with `override` until {@link reset}. */
	override(endpoint: FakeIdpEndpoint, override: FakeIdpOverride): void {
		this.overrides.set(endpoint, override)
	}

	/** Revoke every issued token and code: the user's session at the IdP has ended. */
	revokeAll(): void {
		this.codes.clear()
		this.accessTokens.clear()
		this.refreshTokens.clear()
	}

	/** Requests received by one endpoint. */
	requestsTo(endpoint: FakeIdpEndpoint): FakeIdpRequest[] {
		return this.requests.filter(it => it.endpoint === endpoint)
	}

	/** Endpoints hit, in order, with consecutive repeats kept. */
	endpointsHit(): (FakeIdpEndpoint | null)[] {
		return this.requests.map(it => it.endpoint)
	}

	/**
	 * Play the browser at the authorization endpoint: request `authUrl` and read the response parameters off the
	 * redirect (query or fragment) or the auto-submitting form (`form_post`).
	 */
	async authorize(authUrl: string): Promise<FakeIdpAuthorization> {
		const response = await this.getFromSelf(authUrl)
		const location = response.location
		if (response.status === 302 && location !== undefined) {
			const url = new URL(location)
			const fragment = url.hash.replace(/^#/, '')
			if (fragment !== '') {
				return { redirectTo: location, mode: 'fragment', parameters: Object.fromEntries(new URLSearchParams(fragment)) }
			}
			return { redirectTo: location, mode: 'query', parameters: Object.fromEntries(url.searchParams) }
		}
		const html = response.body
		const action = /<form method="post" action="([^"]*)"/.exec(html)
		if (response.status !== 200 || action === null) {
			throw new Error(`authorization endpoint answered ${response.status}: ${html}`)
		}
		const parameters: Record<string, string> = {}
		for (const [, name, value] of html.matchAll(/<input type="hidden" name="([^"]*)" value="([^"]*)"\/>/g)) {
			parameters[name] = value.replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
		}
		return { redirectTo: action[1].replace(/&amp;/g, '&'), mode: 'form_post', parameters }
	}

	/** Sign a JWT with the IdP's key, as the IdP would sign an ID or logout token. */
	async sign(payload: JWTPayload, header: { readonly kid?: string; readonly typ?: string } = {}): Promise<string> {
		return await new SignJWT(payload)
			.setProtectedHeader({ alg: 'RS256', kid: header.kid ?? this.keys.kid, ...(header.typ ? { typ: header.typ } : {}) })
			.sign(this.keys.privateKey)
	}

	/** A valid OIDC back-channel logout token for the registered client. */
	async signLogoutToken(claims: JWTPayload = {}): Promise<string> {
		const now = Math.floor(Date.now() / 1000)
		return await this.sign(
			{
				iss: this.idTokenIssuer,
				aud: this.client.clientId,
				iat: now,
				exp: now + 120,
				jti: randomToken('jti'),
				events: { 'http://schemas.openid.net/event/backchannel-logout': {} },
				sub: String(this.user.sub),
				...(this.sessionId ? { sid: this.sessionId } : {}),
				...claims,
			},
			{ typ: 'logout+jwt' },
		)
	}

	private urlOn(host: string): string {
		return `http://${host}:${this.port}${this.basePath}`
	}

	/**
	 * A GET of `url` sent to this server whatever its host, so a test never reaches the real host an advertised URL
	 * names. Plain `node:http`: the test environment's global `fetch` is a browser polyfill that follows redirects.
	 */
	private getFromSelf(url: string): Promise<{ status: number; location: string | undefined; body: string }> {
		const target = new URL(url)
		const options = {
			host: '127.0.0.1',
			port: this.port,
			path: `${target.pathname}${target.search}`,
			headers: { host: target.host },
		}
		return new Promise((resolve, reject) => {
			const request = http.get(options, res => {
				readBody(res).then(body => resolve({ status: res.statusCode ?? 0, location: res.headers.location, body }), reject)
			})
			request.on('error', reject)
		})
	}

	private releaseHanging(): void {
		for (const res of this.hangingResponses) {
			res.destroy()
		}
		this.hangingResponses.clear()
	}

	private async handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
		const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'unknown'}`)
		const body = await readBody(req)
		const isForm = (req.headers['content-type'] ?? '').startsWith('application/x-www-form-urlencoded')
		const form = isForm ? Object.fromEntries(new URLSearchParams(body)) : {}
		const relativePath = url.pathname.startsWith(this.basePath) ? url.pathname.slice(this.basePath.length) : null
		const endpoint = ENDPOINTS.find(it => ENDPOINT_PATHS[it] === relativePath) ?? null
		this.requests.push({
			endpoint,
			method: req.method ?? 'GET',
			host: url.hostname.replace(/^\[(.*)]$/, '$1'),
			path: url.pathname,
			query: Object.fromEntries(url.searchParams),
			headers: req.headers,
			form,
		})
		if (endpoint === null) {
			res.writeHead(404).end()
			return
		}
		const override = this.overrides.get(endpoint)
		if (override?.kind === 'hang') {
			this.hangingResponses.add(res)
			return
		}
		if (override?.kind === 'respond') {
			const isText = typeof override.body === 'string' || override.body === undefined
			res.writeHead(override.status, { 'content-type': isText ? 'text/plain' : 'application/json', ...override.headers })
			res.end(override.body === undefined ? undefined : typeof override.body === 'string' ? override.body : JSON.stringify(override.body))
			return
		}
		switch (endpoint) {
			case 'discovery':
				return this.json(res, 200, this.discoveryDocument())
			case 'jwks':
				return this.json(res, 200, { keys: [this.keys.publicJwk] })
			case 'authorization':
				return await this.handleAuthorization(url, res)
			case 'token':
				return await this.handleToken(req, form, res)
			case 'userinfo':
				return this.handleUserinfo(req, res)
			case 'introspection':
				return this.handleIntrospection(req, form, res)
			case 'end_session':
				res.writeHead(200, { 'content-type': 'text/plain' }).end('signed out')
				return
		}
	}

	private discoveryDocument(): Record<string, unknown> {
		const advertised: Record<string, FakeIdpEndpoint> = {
			authorization_endpoint: 'authorization',
			token_endpoint: 'token',
			userinfo_endpoint: 'userinfo',
			jwks_uri: 'jwks',
			introspection_endpoint: 'introspection',
			end_session_endpoint: 'end_session',
		}
		const endpoints = Object.fromEntries(
			Object.entries(advertised)
				.filter(([, endpoint]) => !this.omittedEndpoints.includes(endpoint))
				.map(([key, endpoint]) => [key, this.endpointUrl(endpoint)]),
		)
		return {
			issuer: this.issuer,
			...endpoints,
			response_types_supported: ['code', 'code id_token', 'code id_token token', 'code token', 'id_token', 'id_token token', 'none'],
			response_modes_supported: ['query', 'fragment', 'form_post'],
			grant_types_supported: ['authorization_code', 'implicit', 'refresh_token'],
			subject_types_supported: ['public'],
			id_token_signing_alg_values_supported: ['RS256'],
			token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'none'],
			token_endpoint_auth_signing_alg_values_supported: ['HS256'],
			scopes_supported: ['openid', 'email', 'profile', 'offline_access'],
			backchannel_logout_supported: true,
			backchannel_logout_session_supported: true,
		}
	}

	private async handleAuthorization(url: URL, res: http.ServerResponse): Promise<void> {
		const params = url.searchParams
		const redirectUri = params.get('redirect_uri')
		if (params.get('client_id') !== this.client.clientId || redirectUri === null) {
			return this.json(res, 400, { error: 'invalid_request', error_description: 'unknown client or missing redirect_uri' })
		}
		const responseType = (params.get('response_type') ?? '').split(' ').filter(it => it !== '')
		const nonce = params.get('nonce') ?? undefined
		const scope = params.get('scope') ?? 'openid'
		const state = params.get('state')
		const response: Record<string, string> = {}
		if (state !== null) {
			response.state = state
		}
		if (responseType.includes('code')) {
			const code = randomToken('code')
			this.codes.set(code, { redirectUri, nonce, scope })
			response.code = code
		}
		if (responseType.includes('token')) {
			response.access_token = this.issueAccessToken()
			response.token_type = 'Bearer'
			response.expires_in = String(ACCESS_TOKEN_LIFETIME_SECONDS)
		}
		if (responseType.includes('id_token')) {
			response.id_token = await this.issueIdToken({
				nonce,
				...(response.code ? { c_hash: halfHash(response.code) } : {}),
				...(response.access_token ? { at_hash: halfHash(response.access_token) } : {}),
			})
		}
		const isCodeOnly = responseType.length === 1 && responseType[0] === 'code'
		const isNone = responseType.length === 1 && responseType[0] === 'none'
		const mode = params.get('response_mode') ?? (isCodeOnly || isNone ? 'query' : 'fragment')
		if (mode === 'form_post') {
			const inputs = Object.entries(response)
				.map(([name, value]) => `<input type="hidden" name="${htmlAttribute(name)}" value="${htmlAttribute(value)}"/>`)
				.join('')
			res.writeHead(200, { 'content-type': 'text/html' }).end(`<form method="post" action="${htmlAttribute(redirectUri)}">${inputs}</form>`)
			return
		}
		const target = new URL(redirectUri)
		const encoded = new URLSearchParams(response)
		if (mode === 'fragment') {
			target.hash = encoded.toString()
		} else {
			for (const [key, value] of encoded) {
				target.searchParams.set(key, value)
			}
		}
		res.writeHead(302, { location: target.toString() }).end()
	}

	private async handleToken(req: http.IncomingMessage, form: Record<string, string>, res: http.ServerResponse): Promise<void> {
		if (!this.authenticateClient('token', req, form)) {
			return this.json(res, 401, { error: 'invalid_client' }, { 'www-authenticate': 'Basic realm="fake-idp"' })
		}
		if (form.grant_type === 'authorization_code') {
			const grant = this.codes.get(form.code ?? '')
			if (!grant || grant.redirectUri !== form.redirect_uri) {
				return this.json(res, 400, { error: 'invalid_grant', error_description: 'unknown code or redirect_uri mismatch' })
			}
			this.codes.delete(form.code ?? '')
			const accessToken = this.issueAccessToken()
			const refreshToken = this.alwaysIssueRefreshToken || grant.scope.split(' ').includes('offline_access')
				? this.issueRefreshToken({ scope: grant.scope, nonce: grant.nonce })
				: undefined
			return this.json(res, 200, {
				access_token: accessToken,
				token_type: 'Bearer',
				expires_in: ACCESS_TOKEN_LIFETIME_SECONDS,
				scope: grant.scope,
				id_token: await this.issueIdToken({ nonce: grant.nonce, at_hash: halfHash(accessToken) }),
				...(refreshToken ? { refresh_token: refreshToken } : {}),
			})
		}
		if (form.grant_type === 'refresh_token') {
			const grant = this.refreshTokens.get(form.refresh_token ?? '')
			if (!grant) {
				return this.json(res, 400, { error: 'invalid_grant', error_description: 'unknown refresh token' })
			}
			const accessToken = this.issueAccessToken()
			let refreshToken: string | undefined
			if (this.rotateRefreshTokens) {
				this.refreshTokens.delete(form.refresh_token ?? '')
				refreshToken = this.issueRefreshToken(grant)
			}
			return this.json(res, 200, {
				access_token: accessToken,
				token_type: 'Bearer',
				expires_in: ACCESS_TOKEN_LIFETIME_SECONDS,
				// a refreshed ID token carries no nonce (OIDC Core 12.2)
				...(this.idTokenOnRefresh ? { id_token: await this.issueIdToken({ at_hash: halfHash(accessToken) }) } : {}),
				...(refreshToken ? { refresh_token: refreshToken } : {}),
			})
		}
		return this.json(res, 400, { error: 'unsupported_grant_type' })
	}

	private handleUserinfo(req: http.IncomingMessage, res: http.ServerResponse): void {
		const token = /^Bearer (.+)$/i.exec(req.headers.authorization ?? '')?.[1]
		if (token === undefined || !this.accessTokens.has(token)) {
			res.writeHead(401, { 'www-authenticate': 'Bearer error="invalid_token", error_description="unknown access token"' }).end()
			return
		}
		this.json(res, 200, { ...this.user, ...this.userinfoClaims })
	}

	private handleIntrospection(req: http.IncomingMessage, form: Record<string, string>, res: http.ServerResponse): void {
		if (!this.authenticateClient('introspection', req, form)) {
			return this.json(res, 401, { error: 'invalid_client' })
		}
		const token = form.token ?? ''
		const active = this.accessTokens.has(token) || this.refreshTokens.has(token)
		this.json(res, 200, active ? { active: true, sub: this.user.sub, client_id: this.client.clientId } : { active: false })
	}

	/** Records how the client authenticated; accepts the shared-secret methods only. */
	private authenticateClient(endpoint: FakeIdpEndpoint, req: http.IncomingMessage, form: Record<string, string>): boolean {
		const auth = this.parseClientAuth(req, form)
		this.clientAuth.push({ endpoint, auth })
		if (auth.method === 'client_secret_basic' || auth.method === 'client_secret_post') {
			return auth.clientId === this.client.clientId && auth.clientSecret === this.client.clientSecret
		}
		return auth.method === 'client_secret_jwt'
	}

	private parseClientAuth(req: http.IncomingMessage, form: Record<string, string>): FakeIdpClientAuth {
		const basic = /^Basic (.+)$/i.exec(req.headers.authorization ?? '')?.[1]
		if (basic !== undefined) {
			const decoded = Buffer.from(basic, 'base64').toString('utf8')
			const separator = decoded.indexOf(':')
			return {
				method: 'client_secret_basic',
				clientId: formDecode(decoded.slice(0, separator)),
				clientSecret: formDecode(decoded.slice(separator + 1)),
			}
		}
		if (form.client_secret !== undefined) {
			return { method: 'client_secret_post', clientId: form.client_id ?? '', clientSecret: form.client_secret }
		}
		if (form.client_assertion !== undefined) {
			const method = decodeProtectedHeader(form.client_assertion).alg?.startsWith('HS') ? 'client_secret_jwt' : 'private_key_jwt'
			return { method, clientId: form.client_id, assertion: form.client_assertion }
		}
		return { method: 'none', clientId: form.client_id }
	}

	private issueAccessToken(): string {
		const token = randomToken('access')
		this.accessTokens.add(token)
		return token
	}

	private issueRefreshToken(grant: RefreshGrant): string {
		const token = randomToken('refresh')
		this.refreshTokens.set(token, grant)
		return token
	}

	private async issueIdToken(extra: { nonce?: string; at_hash?: string; c_hash?: string }): Promise<string> {
		const now = Math.floor(Date.now() / 1000)
		const { nonce, ...hashes } = extra
		return await this.sign({
			...this.user,
			...this.options.idTokenClaims,
			iss: this.idTokenIssuer,
			aud: this.client.clientId,
			iat: now,
			exp: now + ACCESS_TOKEN_LIFETIME_SECONDS,
			auth_time: now,
			...(nonce !== undefined ? { nonce } : {}),
			...(this.sessionId ? { sid: this.sessionId } : {}),
			...hashes,
		})
	}

	private json(res: http.ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
		res.writeHead(status, { 'content-type': 'application/json', ...headers }).end(JSON.stringify(body))
	}
}
