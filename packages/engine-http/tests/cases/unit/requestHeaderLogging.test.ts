import { expect, test } from 'bun:test'
import { VerifyErrorCode, VerifyResult, WorkloadTokenVerifier } from '@contember/engine-tenant-api'
import { createLogger, LogEntry, LogLevels, TestLoggerHandler } from '@contember/logger'
import { Application } from '../../../src/application/application.js'
import { Authenticator } from '../../../src/common/Authorizator.js'
import { serverConfigSchema } from '../../../src/config/configSchema.js'
import { ProjectGroupContainer } from '../../../src/projectGroup/ProjectGroupContainer.js'
import { ProjectGroupResolver } from '../../../src/projectGroup/ProjectGroupResolver.js'
import { createMock, createUnusedTenantDatabaseContext } from '../../utils.js'

// §11: there is no redaction layer, so a bearer token or DPoP proof in a log would be replayable by anyone reading it.
const token = 'eyJzZWNyZXQiOiJ0b2tlbiJ9.eyJzdWIiOiJ3b3JrbG9hZCJ9.dG9rZW5zaWduYXR1cmVzZWNyZXQ'
const proof = 'eyJzZWNyZXQiOiJwcm9vZiJ9.eyJodG0iOiJQT1NUIn0.cHJvb2ZzaWduYXR1cmVzZWNyZXQ'
const opaqueToken = 'opaquesecrettoken0123456789'

const unavailable = (): never => {
	throw new Error('This service is not available in the request header logging test')
}

const collectStrings = (value: unknown, seen: Set<unknown>, out: string[], depth = 0): void => {
	if (typeof value === 'string') {
		out.push(value)
		return
	}
	if (value === null || typeof value !== 'object' || seen.has(value) || depth > 12) {
		return
	}
	seen.add(value)
	for (const key of Reflect.ownKeys(value)) {
		if (typeof key === 'string') {
			out.push(key)
		}
		collectStrings(Reflect.get(value, key), seen, out, depth + 1)
	}
	if (value instanceof Error) {
		out.push(value.message, value.stack ?? '')
	}
}

const createTestApplication = () => {
	const handler = new TestLoggerHandler()
	const logger = createLogger(handler, {}, { fingerCrossedOptions: { logAlwaysLevel: LogLevels.debug } })
	const workloadTokenVerifier: Pick<WorkloadTokenVerifier, 'authenticate'> = {
		authenticate: async (_db, request) =>
			request.scheme === 'DPoP'
				? {
					ok: true,
					result: new VerifyResult(
						'trust-identity',
						{ type: 'workload_trust', trustId: 'trust-1', trustSlug: 'web-backend', tokenRef: 'jti-1' },
						[],
						null,
					),
				}
				: { ok: false, error: 'signature', errorMessage: 'Signature verification failed' },
	}
	const authenticator = new Authenticator(
		createUnusedTenantDatabaseContext('write'),
		createUnusedTenantDatabaseContext('read'),
		{ verifyAndProlong: async () => ({ ok: false, error: VerifyErrorCode.NOT_FOUND, errorMessage: 'API key not found' }) },
		workloadTokenVerifier,
		[],
	)
	const projectGroup: ProjectGroupContainer = {
		slug: undefined,
		logger,
		authenticator,
		get projectMembershipResolver() {
			return unavailable()
		},
		get projectContainerResolver() {
			return unavailable()
		},
		get projectSchemaResolver() {
			return unavailable()
		},
		get projectInitializer() {
			return unavailable()
		},
		get tenantContainer() {
			return unavailable()
		},
		get tenantGraphQLHandler() {
			return unavailable()
		},
		get systemContainer() {
			return unavailable()
		},
		get systemGraphQLHandler() {
			return unavailable()
		},
	}
	const application = new Application(
		createMock<ProjectGroupResolver>({ resolveContainer: async () => projectGroup }),
		serverConfigSchema({ port: 0 }),
		true,
		undefined,
		logger,
	)
	return { application, messages: handler.messages }
}

test('request headers never reach the logger, on success or on failure', async () => {
	const { application, messages } = createTestApplication()
	application.addRoute('content', '/content/:projectSlug/:stageSlug', () => {
		// An unexpected error activates the finger-crossed buffer and logs everything collected for the request.
		throw new Error('Controller failed')
	})
	const running = await application.listen()
	try {
		const address = running.server.address()
		if (address === null || typeof address === 'string') {
			throw new Error('The test server did not bind to a TCP port')
		}
		const url = `http://127.0.0.1:${address.port}/content/blog/live`
		const body = JSON.stringify({ query: '{ __typename }' })
		const responses = await Promise.all([
			fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json', 'Authorization': `DPoP ${token}`, 'DPoP': proof } }),
			fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }),
			fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${opaqueToken}` } }),
		])
		expect(responses.map(it => it.status)).toStrictEqual([500, 401, 401])
		await Promise.all(responses.map(it => it.text()))
	} finally {
		await running.close()
	}

	const entries: LogEntry[] = messages
	expect(entries.some(it => it.message === 'User authenticated')).toBe(true)
	expect(entries.some(it => it.error instanceof Error && it.error.message === 'Controller failed')).toBe(true)
	const strings: string[] = []
	collectStrings(entries, new Set(), strings)
	for (const secret of [token, proof, opaqueToken]) {
		expect(strings.filter(it => it.includes(secret))).toStrictEqual([])
	}
	expect(strings.filter(it => /^(authorization|dpop)$/i.test(it))).toStrictEqual([])
})
