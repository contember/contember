import { expect, test } from 'bun:test'
import supertest from 'supertest'
import { apiUrl, createTester, executeGraphql, rand, rootToken } from '../../src/tester.js'
import { emptySchema } from '@contember/schema-utils'

const SOCKET_IP = '203.0.113.10' // pretend "proxy/socket" IP, seen via X-Forwarded-For
const FORWARDED_IP = '198.51.100.5' // pretend "real client" IP, set by trusted proxy
const FORWARDED_UA = 'mobile-app/1.0'

interface GraphqlBody {
	query: string
	variables?: Record<string, unknown>
}

const tenantWithHeaders = async (token: string, body: GraphqlBody, headers: Record<string, string> = {}) => {
	const req = supertest(apiUrl)
		.post('/tenant')
		.set('Authorization', `Bearer ${token}`)
		.set('X-Forwarded-For', SOCKET_IP)
	for (const [name, value] of Object.entries(headers)) {
		req.set(name, value)
	}
	const res = await req.send(body)
	return res
}

const signInWith = async (callerToken: string, email: string, password: string, options: object = {}): Promise<string> => {
	const res = await executeGraphql(
		'/tenant',
		`mutation($email: String!, $password: String!, $options: SignInOptions) {
			signIn(email: $email, password: $password, options: $options) {
				ok
				error { code }
				result { token }
			}
		}`,
		{ authorizationToken: callerToken, variables: { email, password, options } },
	)
	expect(res.status).toBe(200)
	expect(res.body.data.signIn.ok).toBe(true)
	return res.body.data.signIn.result.token
}

test('signIn options.trustForwardedClientInfo: honored when caller api_key has the flag, dropped otherwise', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)

	// Create a backend api_key with trust=true — simulates a trusted proxy.
	const createBackendKey = await executeGraphql(
		'/tenant',
		`mutation {
			createGlobalApiKey(
				description: "trusted backend",
				roles: ["login"],
				options: { trustForwardedClientInfo: true }
			) {
				ok
				error { code }
				result { apiKey { token } }
			}
		}`,
		{},
	)
	expect(createBackendKey.body.data.createGlobalApiKey.ok).toBe(true)
	const trustedBackend: string = createBackendKey.body.data.createGlobalApiKey.result.apiKey.token

	// Path A: caller has trust=true → resulting session inherits trust=true.
	const trustedToken = await signInWith(trustedBackend, email, password, { trustForwardedClientInfo: true })

	// Path B: caller (root token) has trust=false → option is silently dropped → resulting session trust=false.
	const untrustedToken = await signInWith(rootToken, email, password, { trustForwardedClientInfo: true })

	const forwardedHeaders = {
		'X-Contember-Client-IP': FORWARDED_IP,
		'X-Contember-Client-User-Agent': FORWARDED_UA,
	}

	type Session = {
		id: string
		isCurrent: boolean
		trustForwardedClientInfo: boolean
		lastIp: string | null
		lastUserAgent: string | null
	}

	// Session tracking (last_ip/last_user_agent/last_used_at) is written fire-and-forget via
	// setImmediate after the auth response returns (see ApiKeyManager.verifyAndProlong), so it is
	// eventually consistent. Re-trigger both sessions and poll until their lastIp lands, instead of
	// reading once and racing the async write.
	const readSessions = async (): Promise<Session[]> => {
		expect((await tenantWithHeaders(trustedToken, { query: `{ me { id } }` }, forwardedHeaders)).status).toBe(200)
		expect((await tenantWithHeaders(untrustedToken, { query: `{ me { id } }` }, forwardedHeaders)).status).toBe(200)
		const resp = await tenantWithHeaders(
			trustedToken,
			{ query: `{ me { sessions { id isCurrent trustForwardedClientInfo lastIp lastUserAgent } } }` },
			forwardedHeaders,
		)
		expect(resp.status).toBe(200)
		return resp.body.data.me.sessions as Session[]
	}

	let sessions: Session[] = []
	for (let attempt = 0; attempt < 20; attempt++) {
		sessions = await readSessions()
		if (sessions.length === 2 && sessions.every(s => s.lastIp !== null)) {
			break
		}
		await Bun.sleep(50)
	}
	expect(sessions).toHaveLength(2)

	const trusted = sessions.find(s => s.isCurrent)!
	const untrusted = sessions.find(s => !s.isCurrent)!

	expect(trusted.trustForwardedClientInfo).toBe(true)
	expect(trusted.lastIp).toBe(FORWARDED_IP)
	expect(trusted.lastUserAgent).toBe(FORWARDED_UA)

	expect(untrusted.trustForwardedClientInfo).toBe(false)
	expect(untrusted.lastIp).toBe(SOCKET_IP)
	expect(untrusted.lastUserAgent).not.toBe(FORWARDED_UA)
})
