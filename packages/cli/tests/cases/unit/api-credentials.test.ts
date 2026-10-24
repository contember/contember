import { afterEach, describe, expect, test } from 'bun:test'
import { CliError, ExitCode } from '@contember/cli-common'
import type { CredentialsProvider, CredentialsRequest } from '@contember/graphql-client'
import { Readable } from 'node:stream'
import { AdminClient } from '../../../src/lib/admin/AdminClient.js'
import { type ApiCredentials, ApiCredentialsResolver, type ApiTokenSource } from '../../../src/lib/credentials/ApiCredentials.js'
import { fetchWithCredentials } from '../../../src/lib/credentials/fetchWithCredentials.js'
import type { CliEnv } from '../../../src/lib/env.js'
import { RemoteProject } from '../../../src/lib/project/RemoteProject.js'
import { RemoteProjectProvider } from '../../../src/lib/project/RemoteProjectProvider.js'
import { RemoteProjectResolver } from '../../../src/lib/project/RemoteProjectResolver.js'
import { TenantConnectionResolver } from '../../../src/lib/tenant/TenantConnectionResolver.js'
import { DataTransferClient } from '../../../src/lib/transfer/DataTransferClient.js'

const originalFetch = globalThis.fetch

afterEach(() => {
	globalThis.fetch = originalFetch
})

const recordingSourceFactory = () => {
	const sources: ApiTokenSource[] = []
	const factory = (source: ApiTokenSource): CredentialsProvider => {
		sources.push(source)
		return { authenticate: async () => ({ Authorization: 'Bearer from-source' }) }
	}
	return { sources, factory }
}

const expectCliError = (fn: () => unknown, code: string): void => {
	try {
		fn()
	} catch (error) {
		expect(error).toBeInstanceOf(CliError)
		expect(error).toMatchObject({ code, exitCode: ExitCode.InputError })
		return
	}
	throw new Error(`expected ${code}`)
}

describe('API credentials resolution', () => {
	test('uses the DSN password, or CONTEMBER_API_TOKEN without a DSN', async () => {
		const resolver = new ApiCredentialsResolver({ apiToken: 'env-token' })

		expect(resolver.resolve('dsn-password')?.staticToken).toBe('dsn-password')
		expect(resolver.resolve(undefined)?.staticToken).toBe('env-token')
		expect(await resolver.resolve(undefined)?.authenticate({ url: 'https://api.test', method: 'POST', refresh: false }))
			.toEqual({ Authorization: 'Bearer env-token' })
		// a DSN without a password never falls back to CONTEMBER_API_TOKEN
		expect(resolver.resolve('')).toBeUndefined()
		expect(new ApiCredentialsResolver({}).resolve(undefined)).toBeUndefined()
	})

	test('a github-actions source requires an audience', () => {
		expectCliError(() => new ApiCredentialsResolver({ apiTokenSource: 'github-actions' }).resolve(undefined), 'API_TOKEN_AUDIENCE_MISSING')
		expectCliError(
			() => new ApiCredentialsResolver({ apiTokenSource: 'github-actions', apiTokenAudience: '' }).resolve(undefined),
			'API_TOKEN_AUDIENCE_MISSING',
		)
	})

	test('a token source conflicts with CONTEMBER_API_TOKEN and with a DSN password', () => {
		const { factory } = recordingSourceFactory()
		const env: CliEnv = { apiTokenSource: 'github-actions', apiTokenAudience: 'contember:test:deploy' }

		expectCliError(() => new ApiCredentialsResolver({ ...env, apiToken: 'env-token' }, factory).resolve(undefined), 'API_TOKEN_SOURCE_CONFLICT')
		expectCliError(() => new ApiCredentialsResolver(env, factory).resolve('dsn-password'), 'API_TOKEN_SOURCE_CONFLICT')
		// a DSN without a password is the documented way to combine a DSN with a source
		expect(new ApiCredentialsResolver(env, factory).resolve('')?.staticToken).toBeNull()
	})

	test('rejects an unknown source and an empty kubernetes path', () => {
		for (const apiTokenSource of ['gitlab', 'kubernetes', 'kubernetes:']) {
			expectCliError(() => new ApiCredentialsResolver({ apiTokenSource }).resolve(undefined), 'API_TOKEN_SOURCE_INVALID')
		}
	})

	test('builds the source from the env: the kubernetes path, the github-actions audience', () => {
		const kubernetes = recordingSourceFactory()
		new ApiCredentialsResolver({ apiTokenSource: 'kubernetes:/var/run/secrets/tokens/contember' }, kubernetes.factory).resolve(undefined)
		expect(kubernetes.sources).toEqual([{ type: 'kubernetes', path: '/var/run/secrets/tokens/contember' }])

		const github = recordingSourceFactory()
		const credentials = new ApiCredentialsResolver({ apiTokenSource: 'github-actions', apiTokenAudience: 'contember:test:deploy' }, github.factory)
			.resolve(undefined)
		expect(github.sources).toEqual([{ type: 'github-actions', audience: 'contember:test:deploy' }])
		expect(credentials?.description).toBe('github-actions token source (audience contember:test:deploy)')
	})

	test('every connection shares one source provider', () => {
		const { sources, factory } = recordingSourceFactory()
		const env: CliEnv = {
			apiUrl: 'https://api.example.test',
			projectName: 'blog',
			apiTokenSource: 'github-actions',
			apiTokenAudience: 'contember:test:deploy',
		}
		const resolver = new ApiCredentialsResolver(env, factory)

		const project = new RemoteProjectResolver(env, resolver).resolve()
		const tenant = new TenantConnectionResolver(env, resolver).resolve()
		const transferTarget = new RemoteProjectResolver(env, resolver).resolve('contember://other@api.example.test')

		expect(sources).toHaveLength(1)
		expect(project?.credentials).toBe(tenant?.credentials)
		expect(transferTarget?.credentials).toBe(project?.credentials)
	})

	test('a source failure becomes a typed CLI error', async () => {
		const credentials = new ApiCredentialsResolver(
			{ apiTokenSource: 'kubernetes:/missing' },
			() => ({
				authenticate: async () => {
					throw new Error('ENOENT: /missing')
				},
			}),
		).resolve(undefined)

		await expect(credentials?.authenticate({ url: 'https://api.test', method: 'POST', refresh: false })).rejects.toMatchObject({
			code: 'API_TOKEN_SOURCE_FAILED',
			exitCode: ExitCode.InputError,
		})
	})

	test('a source that cannot be built becomes a typed CLI error', () => {
		const resolver = new ApiCredentialsResolver(
			{ apiTokenSource: 'github-actions', apiTokenAudience: 'contember:test:deploy' },
			() => {
				throw new Error('ACTIONS_ID_TOKEN_REQUEST_URL is not set')
			},
		)

		expectCliError(() => resolver.resolve(undefined), 'API_TOKEN_SOURCE_FAILED')
	})

	test('the env project resolves on first access, so a credential conflict fails only the commands that connect', () => {
		const env: CliEnv = { apiUrl: 'https://api.example.test', projectName: 'blog', apiToken: 'env-token', apiTokenSource: 'kubernetes:/token' }
		const resolver = new RemoteProjectResolver(env)
		const provider = new RemoteProjectProvider(() => resolver.resolve())

		expectCliError(() => provider.get(), 'API_TOKEN_SOURCE_CONFLICT')
	})
})

/** Hands out a new token per call, so a test can tell which request carried which credential. */
const recordingCredentials = () => {
	const requests: CredentialsRequest[] = []
	const credentials: ApiCredentials = {
		description: 'test source',
		staticToken: null,
		authenticate: async request => {
			requests.push(request)
			return { Authorization: `Bearer token-${requests.length}` }
		},
	}
	return { credentials, requests }
}

const stubFetch = (statuses: number[]) => {
	const sent: { url: string; authorization: string | null; body: string | null }[] = []
	globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		sent.push({
			url: String(input),
			authorization: new Headers(init?.headers).get('authorization'),
			body: typeof init?.body === 'string' ? init.body : null,
		})
		const status = statuses[Math.min(sent.length - 1, statuses.length - 1)]
		return new Response(JSON.stringify({ ok: true }), { status })
	}
	return sent
}

describe('raw fetch authentication', () => {
	test('authenticates each request right before sending it', async () => {
		const { credentials, requests } = recordingCredentials()
		const sent = stubFetch([200])

		const response = await fetchWithCredentials(credentials, 'https://admin.test/_deploy', { method: 'POST', headers: {}, body: '{}' })

		expect(response.status).toBe(200)
		expect(requests).toEqual([{ url: 'https://admin.test/_deploy', method: 'POST', refresh: false }])
		expect(sent.map(it => it.authorization)).toEqual(['Bearer token-1'])
	})

	test('retries a replayable request once on 401 with a refreshed credential', async () => {
		const { credentials, requests } = recordingCredentials()
		const sent = stubFetch([401, 200])

		const response = await fetchWithCredentials(credentials, 'https://api.test/export', { method: 'POST', headers: {}, body: '{"a":1}' })

		expect(response.status).toBe(200)
		expect(requests.map(it => it.refresh)).toEqual([false, true])
		expect(sent.map(it => [it.authorization, it.body])).toEqual([['Bearer token-1', '{"a":1}'], ['Bearer token-2', '{"a":1}']])
	})

	test('a second 401 is returned, not retried again; 403 is never retried', async () => {
		const unauthorized = stubFetch([401, 401, 200])
		expect((await fetchWithCredentials(recordingCredentials().credentials, 'https://api.test', { method: 'POST', headers: {} })).status).toBe(401)
		expect(unauthorized).toHaveLength(2)

		const forbidden = stubFetch([403, 200])
		expect((await fetchWithCredentials(recordingCredentials().credentials, 'https://api.test', { method: 'POST', headers: {} })).status).toBe(403)
		expect(forbidden).toHaveLength(1)
	})

	test('the admin deploy refreshes its credential once on 401', async () => {
		const { credentials, requests } = recordingCredentials()
		const sent = stubFetch([401, 200])
		const provider = new RemoteProjectProvider()
		provider.setRemoteProject(new RemoteProject('blog', 'https://api.example.test', credentials, 'https://admin.example.test'))

		await new AdminClient(provider).deploy('blog', [{ path: 'index.html', data: '' }])

		expect(requests.map(it => it.refresh)).toEqual([false, true])
		expect(sent).toHaveLength(2)
	})

	test('a data export refreshes its credential once on 401', async () => {
		const { credentials, requests } = recordingCredentials()
		const sent = stubFetch([401, 200])

		await new DataTransferClient().dataExport({
			project: new RemoteProject('blog', 'https://api.example.test', credentials),
			includeSystem: false,
			gzip: false,
		})

		expect(requests.map(it => it.refresh)).toEqual([false, true])
		expect(sent.map(it => it.url)).toEqual(['https://api.example.test/export', 'https://api.example.test/export'])
	})

	test('a streamed import is never retried: its body cannot be replayed, so the 401 surfaces', async () => {
		const { credentials, requests } = recordingCredentials()
		const sent = stubFetch([401, 200])

		const promise = new DataTransferClient().dataImport({
			stream: Readable.from([JSON.stringify(['importSequence', {}]) + '\n']),
			project: new RemoteProject('blog', 'https://api.example.test', credentials),
			printProgress: () => undefined,
			gzip: false,
		})

		await expect(promise).rejects.toMatchObject({ code: 'TRANSFER_IMPORT_UNAUTHORIZED', exitCode: ExitCode.Forbidden })
		expect(requests).toEqual([{ url: 'https://api.example.test/import', method: 'POST', refresh: false }])
		expect(sent).toHaveLength(1)
	})
})
