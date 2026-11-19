import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import https from 'node:https'
import { LookupFunction } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Duplex } from 'node:stream'
import tls from 'node:tls'
import { EgressGuard, EgressHttpOptions, EgressPolicy } from '@contember/engine-common'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { FakeIdp } from './FakeIdp.js'
import { configurationFor, signIn } from './harness.js'

const ENTRA_HOST = 'login.microsoftonline.com'
const ENTRA_ORIGIN = `https://${ENTRA_HOST}`

/** A self-signed certificate for the Entra host, made at test time so no key is committed. */
const createCertificate = (): { key: string; cert: string } => {
	const dir = mkdtempSync(join(tmpdir(), 'fake-entra-'))
	try {
		const result = spawnSync('openssl', [
			'req',
			'-x509',
			'-newkey',
			'rsa:2048',
			'-nodes',
			'-days',
			'1',
			'-subj',
			`/CN=${ENTRA_HOST}`,
			'-addext',
			`subjectAltName=DNS:${ENTRA_HOST}`,
			'-keyout',
			join(dir, 'key.pem'),
			'-out',
			join(dir, 'cert.pem'),
		])
		if (result.status !== 0) {
			throw new Error(`openssl failed: ${result.error?.message ?? result.stderr.toString()}`)
		}
		return { key: readFileSync(join(dir, 'key.pem'), 'utf8'), cert: readFileSync(join(dir, 'cert.pem'), 'utf8') }
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
}

/** Connects every request to the fake IdP, whatever the URL, trusting its certificate. */
class RedirectingAgent extends https.Agent {
	constructor(private readonly port: number, private readonly cert: string) {
		super({ keepAlive: false })
	}

	override createConnection(): Duplex {
		return tls.connect({ host: '127.0.0.1', port: this.port, servername: ENTRA_HOST, ca: this.cert })
	}
}

const refusingLookup: LookupFunction = (hostname, _, callback) => callback(new Error(`unexpected lookup of ${hostname}`), '', 4)

/**
 * Not a guard: the provider's only seam for the agent of its outbound requests, used to reach the fake IdP as
 * `https://login.microsoftonline.com`.
 */
class RedirectingEgress extends EgressGuard {
	private readonly agent: RedirectingAgent

	constructor(port: number, cert: string) {
		super(new EgressPolicy({ allowHttp: false, allowlist: [] }))
		this.agent = new RedirectingAgent(port, cert)
	}

	override httpOptions(): EgressHttpOptions {
		return { agent: this.agent, lookup: refusingLookup }
	}

	override dispose(): void {
		this.agent.destroy()
		super.dispose()
	}
}

/**
 * Entra ID's multi-tenant endpoints advertise the issuer `https://login.microsoftonline.com/{tenantid}/v2.0`, while each
 * ID token carries its own tenant. openid-client 5 substitutes the token's `tid` into the template, but only for an
 * issuer discovered from one of the Microsoft multi-tenant discovery URLs, so this test serves the fake IdP under
 * that exact origin.
 */
describe('Entra ID multi-tenant issuer', () => {
	let idp: FakeIdp
	let egress: RedirectingEgress

	beforeAll(async () => {
		const certificate = createCertificate()
		idp = await FakeIdp.start({
			tls: certificate,
			hostname: ENTRA_HOST,
			publicOrigin: ENTRA_ORIGIN,
			basePath: '/common/v2.0',
			issuer: () => `${ENTRA_ORIGIN}/{tenantid}/v2.0`,
			idTokenIssuer: () => `${ENTRA_ORIGIN}/tenant-a/v2.0`,
		})
		egress = new RedirectingEgress(idp.listeningPort, certificate.cert)
	})
	afterAll(async () => {
		egress.dispose()
		await idp.stop()
	})
	beforeEach(() => {
		idp.reset()
		idp.user = { ...idp.user, tid: 'tenant-a' }
	})

	test('the common endpoint: an ID token of any tenant is accepted against its own tid', async () => {
		const configuration = configurationFor(idp, { url: `${ENTRA_ORIGIN}/common/v2.0` })

		const { response } = await signIn(new OIDCProvider(egress, null), configuration, idp)

		expect(response).toMatchObject({ externalIdentifier: 'user-1', iss: `${ENTRA_ORIGIN}/tenant-a/v2.0`, tid: 'tenant-a' })
		expect(idp.requestsTo('discovery').map(it => it.path)).toEqual(['/common/v2.0/.well-known/openid-configuration'])
	})

	test('an iss of another tenant than the tid: refused', async () => {
		const configuration = configurationFor(idp, { url: `${ENTRA_ORIGIN}/common/v2.0` })
		idp.user = { ...idp.user, tid: 'tenant-b' }

		const promise = signIn(new OIDCProvider(egress, null), configuration, idp)

		await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
		await expect(promise).rejects.toThrow(`unexpected iss value, expected ${ENTRA_ORIGIN}/tenant-b/v2.0, got: ${ENTRA_ORIGIN}/tenant-a/v2.0`)
	})
})
