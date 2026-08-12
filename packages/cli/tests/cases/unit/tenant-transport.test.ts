import { describe, expect, test } from 'bun:test'
import { CliError, ExitCode } from '@contember/cli-common'
import { GraphQlClient, GraphQlClientError } from '@contember/graphql-client'
import { disableIDPResponse$$, identityProvider$, mutation$, query$ } from '@contember/graphql-client-tenant'
import {
	createTenantApiUrl,
	TenantApiTransport,
	tenantErrorCodeToExitCode,
	TenantMutationResult,
} from '../../../src/lib/tenant/TenantApiTransport.js'
import { inspect } from 'node:util'

const identityProvidersFetcher = query$.identityProviders(identityProvider$.slug.type)
const disableIdpFetcher = mutation$.disableIDP(disableIDPResponse$$)

interface FakeResponse {
	status?: number
	body: string
}

interface CapturedRequest {
	url: string
	query: string
	variables: unknown
}

const createTransport = (handler: (request: CapturedRequest) => FakeResponse) => {
	const requests: CapturedRequest[] = []
	const client = new GraphQlClient({
		url: createTenantApiUrl('http://localhost:1481'),
		apiToken: 'test-token',
		fetcher: async (input, init) => {
			const { query, variables }: { query: string; variables: unknown } = JSON.parse(String(init?.body))
			const request = { url: String(input), query, variables }
			requests.push(request)
			const response = handler(request)
			return new Response(response.body, { status: response.status ?? 200 })
		},
	})
	return { transport: new TenantApiTransport(client), requests }
}

const createThrowingTransport = (error: unknown) => {
	const client = new GraphQlClient({
		url: createTenantApiUrl('http://localhost:1481'),
		fetcher: async () => {
			throw error
		},
	})
	return new TenantApiTransport(client)
}

const catchCliError = async (fn: () => Promise<unknown>): Promise<CliError> => {
	try {
		await fn()
	} catch (e) {
		if (e instanceof CliError) {
			return e
		}
		throw e
	}
	throw new Error('expected a CliError to be thrown')
}

describe('createTenantApiUrl', () => {
	test('appends the tenant path', () => {
		expect(createTenantApiUrl('http://localhost:1480')).toBe('http://localhost:1480/tenant')
	})

	test('strips a trailing slash before appending', () => {
		expect(createTenantApiUrl('http://localhost:1480/')).toBe('http://localhost:1480/tenant')
	})

	test('keeps an url that already points at the tenant api', () => {
		expect(createTenantApiUrl('http://localhost:1480/tenant')).toBe('http://localhost:1480/tenant')
	})

	test('keeps an url that already points at the tenant api with a trailing slash', () => {
		expect(createTenantApiUrl('http://localhost:1480/tenant/')).toBe('http://localhost:1480/tenant')
	})

	test('is used when constructing a transport', () => {
		expect(TenantApiTransport.create('http://localhost:1480', 'token').apiUrl).toBe('http://localhost:1480/tenant')
	})
})

describe('TenantApiTransport.exec', () => {
	test('executes a query and returns its data', async () => {
		const { transport, requests } = createTransport(() => ({
			body: JSON.stringify({ data: { identityProviders: [{ slug: 'google', type: 'oidc' }] } }),
		}))

		const result = await transport.exec(identityProvidersFetcher, {})

		expect(result.identityProviders).toEqual([{ slug: 'google', type: 'oidc' }])
		expect(requests).toHaveLength(1)
		expect(requests[0].url).toBe('http://localhost:1481/tenant')
		expect(requests[0].query.startsWith('query')).toBe(true)
		expect(requests[0].query).toContain('identityProviders')
	})

	test('executes a mutation and declares its variables', async () => {
		const { transport, requests } = createTransport(() => ({
			body: JSON.stringify({ data: { disableIDP: { ok: true } } }),
		}))

		const result = await transport.exec(disableIdpFetcher, { identityProvider: 'google' })

		expect(result.disableIDP?.ok).toBe(true)
		expect(requests[0].query.startsWith('mutation')).toBe(true)
		expect(requests[0].query).toContain('$identityProvider: String!')
		expect(requests[0].variables).toEqual({ identityProvider: 'google' })
	})
})

describe('TenantApiTransport error normalization', () => {
	const execFailing = (response: FakeResponse) => {
		const { transport } = createTransport(() => response)
		return catchCliError(() => transport.exec(identityProvidersFetcher, {}))
	}
	const statusCases = [
		{ status: 400, code: 'TENANT_API_BAD_REQUEST', exitCode: ExitCode.InputError },
		{ status: 401, code: 'TENANT_API_UNAUTHORIZED', exitCode: ExitCode.Forbidden },
		{ status: 403, code: 'TENANT_API_FORBIDDEN', exitCode: ExitCode.Forbidden },
		{ status: 404, code: 'TENANT_API_NOT_FOUND', exitCode: ExitCode.NotFound },
		{ status: 408, code: 'TENANT_API_TIMEOUT', exitCode: ExitCode.Transient },
		{ status: 409, code: 'TENANT_API_CONFLICT', exitCode: ExitCode.Conflict },
		{ status: 425, code: 'TENANT_API_TOO_EARLY', exitCode: ExitCode.Transient },
		{ status: 429, code: 'TENANT_API_RATE_LIMITED', exitCode: ExitCode.Transient },
		{ status: 500, code: 'TENANT_API_SERVER_ERROR', exitCode: ExitCode.Transient },
	]

	test('a network failure is transient and retryable', async () => {
		const transport = createThrowingTransport(new Error('ECONNREFUSED'))
		const error = await catchCliError(() => transport.exec(identityProvidersFetcher, {}))

		expect(error.code).toBe('TENANT_API_UNREACHABLE')
		expect(error.exitCode).toBe(ExitCode.Transient)
		expect(error.retryable).toBe(true)
	})

	test('an aborted request is transient', async () => {
		const aborted = new Error('aborted')
		aborted.name = 'AbortError'
		const transport = createThrowingTransport(aborted)
		const error = await catchCliError(() => transport.exec(identityProvidersFetcher, {}))

		expect(error.code).toBe('TENANT_API_ABORTED')
		expect(error.exitCode).toBe(ExitCode.Transient)
	})

	for (const { status, code, exitCode } of statusCases) {
		test(`classifies HTTP ${status}`, async () => {
			const error = await execFailing({ status, body: '{}' })

			expect(error.code).toBe(code)
			expect(error.exitCode).toBe(exitCode)
			expect(error.retryable).toBe(exitCode === ExitCode.Transient)
		})
	}

	test('a resolver ForbiddenError is forbidden whatever the status', async () => {
		const error = await execFailing({
			status: 400,
			body: JSON.stringify({ errors: [{ message: 'You are not allowed to do this', extensions: { code: 'ForbiddenError' } }] }),
		})

		expect(error.code).toBe('TENANT_API_FORBIDDEN')
		expect(error.exitCode).toBe(ExitCode.Forbidden)
	})

	test('graphql errors on a 200 are an input error', async () => {
		const error = await execFailing({ body: JSON.stringify({ data: null, errors: [{ message: 'Variable is not defined' }] }) })

		expect(error.code).toBe('TENANT_API_ERROR')
		expect(error.exitCode).toBe(ExitCode.InputError)
	})

	test('a graphql internal-server error on a 200 is transient', async () => {
		const error = await execFailing({
			body: JSON.stringify({
				data: null,
				errors: [{ message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } }],
			}),
		})

		expect(error.code).toBe('TENANT_API_SERVER_ERROR')
		expect(error.exitCode).toBe(ExitCode.Transient)
	})

	test('does not copy graphql messages or variables into the error', async () => {
		const secret = 'secret-response-value'
		const { transport } = createTransport(() => ({
			status: 400,
			body: JSON.stringify({ errors: [{ message: `Invalid value ${secret}` }] }),
		}))

		const error = await catchCliError(() => transport.exec(disableIdpFetcher, { identityProvider: secret }))
		const serialized = inspect(error, { depth: null })

		expect(serialized).not.toContain(secret)
		expect(serialized).not.toContain('identityProviders')
		expect(error.cause).toBeInstanceOf(Error)
		expect(error.cause).not.toBeInstanceOf(GraphQlClientError)
	})

	test('an unparseable body is an internal error', async () => {
		const error = await execFailing({ body: '<html>gateway</html>' })

		expect(error.code).toBe('TENANT_API_INVALID_RESPONSE')
		expect(error.exitCode).toBe(ExitCode.InternalError)
	})

	test('the request context is attached as details, not to the message', async () => {
		const error = await execFailing({ status: 503, body: '{}' })

		expect(error.message).not.toContain('identityProviders')
		expect(error.details).toEqual({ type: 'server error', url: 'http://localhost:1481/tenant', status: 503 })
	})
})

describe('TenantApiTransport.assertOk', () => {
	const transport = TenantApiTransport.create('http://localhost:1481', 'token')

	const assertFails = (result: TenantMutationResult | null) =>
		catchCliError(async () => {
			transport.assertOk(result, 'testOperation')
		})

	test('passes an ok result through', () => {
		expect(() => transport.assertOk({ ok: true }, 'testOperation')).not.toThrow()
	})

	test('carries the tenant code and the developer message', async () => {
		const error = await assertFails({ ok: false, error: { code: 'INVALID_CONFIG', developerMessage: 'nope' } })

		expect(error.code).toBe('INVALID_CONFIG')
		expect(error.message).toBe('testOperation failed: INVALID_CONFIG — nope')
		expect(error.exitCode).toBe(ExitCode.InputError)
		expect(error.details).toEqual({ operation: 'testOperation', code: 'INVALID_CONFIG', developerMessage: 'nope' })
	})

	test('copies only allowlisted recovery fields into details', async () => {
		const error = await assertFails({
			ok: false,
			error: {
				code: 'TOO_WEAK',
				developerMessage: 'weak',
				weakPasswordReasons: ['TOO_SHORT', 'UNKNOWN_REASON', 42],
				recommendedAction: 'RESET_PASSWORD',
			},
		})

		expect(error.details).toEqual({
			operation: 'testOperation',
			code: 'TOO_WEAK',
			developerMessage: 'weak',
			weakPasswordReasons: ['TOO_SHORT'],
			recommendedAction: 'RESET_PASSWORD',
		})
	})

	test('a missing error object becomes an internal error', async () => {
		const error = await assertFails({ ok: false })

		expect(error.code).toBe('UNKNOWN')
		expect(error.exitCode).toBe(ExitCode.InternalError)
	})

	test('a missing result becomes an internal error', async () => {
		const error = await assertFails(null)

		expect(error.code).toBe('UNKNOWN')
		expect(error.exitCode).toBe(ExitCode.InternalError)
	})
})

describe('tenantErrorCodeToExitCode', () => {
	test('maps conflicts', () => {
		expect(tenantErrorCodeToExitCode('ALREADY_EXISTS')).toBe(ExitCode.Conflict)
		expect(tenantErrorCodeToExitCode('ALREADY_MEMBER')).toBe(ExitCode.Conflict)
		expect(tenantErrorCodeToExitCode('PERSON_ALREADY_EXISTS')).toBe(ExitCode.Conflict)
	})

	test('maps not-found', () => {
		expect(tenantErrorCodeToExitCode('NOT_FOUND')).toBe(ExitCode.NotFound)
		expect(tenantErrorCodeToExitCode('PROJECT_NOT_FOUND')).toBe(ExitCode.NotFound)
		expect(tenantErrorCodeToExitCode('UNKNOWN_PERSON_ID')).toBe(ExitCode.NotFound)
		expect(tenantErrorCodeToExitCode('NOT_MEMBER')).toBe(ExitCode.NotFound)
	})

	test('maps permission failures', () => {
		expect(tenantErrorCodeToExitCode('INVALID_CREDENTIALS')).toBe(ExitCode.Forbidden)
		expect(tenantErrorCodeToExitCode('MFA_REQUIRED')).toBe(ExitCode.Forbidden)
	})

	test('maps a disallowed project field to an input error', () => {
		expect(tenantErrorCodeToExitCode('PROJECT_NOT_ALLOWED')).toBe(ExitCode.InputError)
	})

	test('maps rate limits to transient', () => {
		expect(tenantErrorCodeToExitCode('RATE_LIMITED')).toBe(ExitCode.Transient)
		expect(tenantErrorCodeToExitCode('RATE_LIMIT_EXCEEDED')).toBe(ExitCode.Transient)
	})

	test('maps server-side failures to internal', () => {
		expect(tenantErrorCodeToExitCode('INIT_ERROR')).toBe(ExitCode.InternalError)
		expect(tenantErrorCodeToExitCode('UNKNOWN')).toBe(ExitCode.InternalError)
	})

	test('falls back on the naming convention for codes added later', () => {
		expect(tenantErrorCodeToExitCode('MAILBOX_NOT_FOUND')).toBe(ExitCode.NotFound)
		expect(tenantErrorCodeToExitCode('ALREADY_INVITED')).toBe(ExitCode.Conflict)
		expect(tenantErrorCodeToExitCode('PROJECT_ALREADY_LOCKED')).toBe(ExitCode.Conflict)
		expect(tenantErrorCodeToExitCode('SIGN_IN_RATE_LIMIT')).toBe(ExitCode.Transient)
	})

	test('defaults to an input error', () => {
		expect(tenantErrorCodeToExitCode('INVALID_MEMBERSHIP')).toBe(ExitCode.InputError)
		expect(tenantErrorCodeToExitCode('SOMETHING_NEW')).toBe(ExitCode.InputError)
	})
})
