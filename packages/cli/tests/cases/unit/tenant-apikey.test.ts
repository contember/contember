import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { CliError, ExitCode, InvalidInputError } from '@contember/cli-common'
import { GraphQlClient } from '@contember/graphql-client'
import { TenantApiTransport } from '../../../src/lib/tenant/TenantApiTransport.js'
import { createTenantClients } from '../../../src/lib/tenant/clients/index.js'
import { TenantClientProvider } from '../../../src/lib/TenantClientProvider.js'
import { RemoteProject } from '../../../src/lib/project/RemoteProject.js'
import { RemoteProjectProvider } from '../../../src/lib/project/RemoteProjectProvider.js'
import { TenantApiKeyCreateCommand } from '../../../src/commands/tenant/apikey/TenantApiKeyCreateCommand.js'
import { TenantApiKeyDisableCommand } from '../../../src/commands/tenant/apikey/TenantApiKeyDisableCommand.js'
import { TenantApiKeyListCommand } from '../../../src/commands/tenant/apikey/TenantApiKeyListCommand.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'

interface CapturedRequest {
	query: string
	variables: unknown
}

/** Answers every request with `data`, capturing what was sent — same helper shape as tenant-clients.test.ts. */
const createClients = (data: unknown) => {
	const requests: CapturedRequest[] = []
	const client = new GraphQlClient({
		url: 'http://localhost:1481/tenant',
		fetcher: async (input, init) => {
			const { query, variables }: { query: string; variables: unknown } = JSON.parse(String(init?.body))
			requests.push({ query, variables })
			return new Response(JSON.stringify({ data }), { status: 200 })
		},
	})
	return { clients: createTenantClients(new TenantApiTransport(client)), requests }
}

describe('TenantApiKeyClient', () => {
	test('listProjectApiKeys selects project.apiKeys with the project slug variable', async () => {
		const { clients, requests } = createClients({
			projectBySlug: { apiKeys: [{ id: 'project-key', description: 'CI' }] },
		})

		const result = await clients.apiKey.listProjectApiKeys('blog')

		expect(result).toEqual([{
			id: 'project-key',
			description: 'CI',
			type: null,
			enabled: null,
			createdAt: null,
			lastUsedAt: null,
			expiresAt: null,
		}])
		expect(requests[0].variables).toEqual({ slug: 'blog' })
		expect(requests[0].query).toContain('projectBySlug')
		expect(requests[0].query).toContain('apiKeys')
	})

	test('listProjectApiKeys reports a missing or invisible project as typed not-found', async () => {
		const { clients } = createClients({ projectBySlug: null })

		try {
			await clients.apiKey.listProjectApiKeys('missing')
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('PROJECT_NOT_FOUND')
				expect(e.exitCode).toBe(ExitCode.NotFound)
				expect(e.message).toContain('missing')
			}
		}
	})

	test('createApiKey sends projectSlug, memberships and description', async () => {
		const { clients, requests } = createClients({
			createApiKey: { ok: true, errors: [], result: { apiKey: { id: 'k1', token: 'plain-token' } } },
		})

		const result = await clients.apiKey.createApiKey({
			projectSlug: 'blog',
			memberships: [{ role: 'editor', variables: [] }],
			description: 'ci key',
		})

		expect(result).toEqual({ id: 'k1', token: 'plain-token' })
		expect(requests[0].variables).toEqual({
			projectSlug: 'blog',
			memberships: [{ role: 'editor', variables: [] }],
			description: 'ci key',
			tokenHash: undefined,
			options: undefined,
		})
	})

	test('createApiKey with a tokenHash gets back a null token — the server never had the plaintext', async () => {
		const { clients } = createClients({
			createApiKey: { ok: true, errors: [], result: { apiKey: { id: 'k1' } } },
		})

		const result = await clients.apiKey.createApiKey({
			projectSlug: 'blog',
			memberships: [],
			description: 'preissued',
			tokenHash: 'a'.repeat(64),
		})

		expect(result).toEqual({ id: 'k1', token: null })
	})

	test('createGlobalApiKey sends roles', async () => {
		const { clients, requests } = createClients({
			createGlobalApiKey: { ok: true, errors: [], result: { apiKey: { id: 'k2', token: 'global-token' } } },
		})

		const result = await clients.apiKey.createGlobalApiKey({ description: 'root key', roles: ['super_admin'] })

		expect(result).toEqual({ id: 'k2', token: 'global-token' })
		expect(requests[0].variables).toEqual({ description: 'root key', roles: ['super_admin'], tokenHash: undefined, options: undefined })
	})

	test('createApiKey reports a failing payload with the operation label, and the message never carries a token', async () => {
		const { clients } = createClients({
			createApiKey: { ok: false, errors: [], error: { code: 'INVALID_MEMBERSHIP', developerMessage: 'unknown role' } },
		})

		try {
			await clients.apiKey.createApiKey({ projectSlug: 'blog', memberships: [{ role: 'nope', variables: [] }], description: 'x' })
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('INVALID_MEMBERSHIP')
				expect(e.exitCode).toBe(ExitCode.InputError)
				expect(e.message).toContain('createApiKey(blog)')
			}
		}
	})

	test('disableApiKey sends the id', async () => {
		const { clients, requests } = createClients({ disableApiKey: { ok: true, errors: [] } })
		await clients.apiKey.disableApiKey('k1')
		expect(requests[0].variables).toEqual({ id: 'k1' })
	})
})

describe('tenant api-key commands', () => {
	const API_URL = 'http://tenant.test'
	const PROJECT_TOKEN = 'b'.repeat(40)
	const GLOBAL_TOKEN = 'c'.repeat(40)
	let generatedGlobalToken = GLOBAL_TOKEN
	let credentialContract: 'normal' | 'missing-generated' | 'unexpected-plaintext' = 'normal'
	const originalFetch = globalThis.fetch
	const sent: CapturedRequest[] = []

	/**
	 * The commands build their own transport via `TenantClientProvider`, so the network is stubbed at the
	 * global `fetch` — same approach as tenant-apply-command.test.ts (happy-dom's fetch cannot reach `Bun.serve`).
	 */
	beforeAll(() => {
		globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
			const { query, variables }: { query: string; variables: unknown } = JSON.parse(String(init?.body))
			sent.push({ query, variables })
			const hasTokenHash = isRecord(variables) && typeof variables.tokenHash === 'string'

			if (query.includes('globalApiKeys')) {
				return json({ globalApiKeys: [{ id: 'k1', type: 'PERMANENT', enabled: true }] })
			}
			if (query.includes('projectBySlug') && query.includes('apiKeys')) {
				const projectSlug = isRecord(variables) ? variables.slug : undefined
				return json({ projectBySlug: projectSlug === 'missing' ? null : { apiKeys: [{ id: 'project-key', description: 'CI' }] } })
			}
			if (query.includes('createGlobalApiKey')) {
				const apiKey = credentialContract === 'missing-generated'
					? { id: 'global-key' }
					: credentialContract === 'unexpected-plaintext'
					? { id: 'global-key', token: generatedGlobalToken }
					: hasTokenHash
					? { id: 'global-key' }
					: { id: 'global-key', token: generatedGlobalToken }
				return json({ createGlobalApiKey: { ok: true, errors: [], result: { apiKey } } })
			}
			if (query.includes('createApiKey')) {
				const apiKey = hasTokenHash ? { id: 'new-key' } : { id: 'new-key', token: PROJECT_TOKEN }
				return json({ createApiKey: { ok: true, errors: [], result: { apiKey } } })
			}
			if (query.includes('disableApiKey')) {
				return json({ disableApiKey: { ok: true, errors: [] } })
			}
			throw new Error(`Unexpected query: ${query}`)
		}
	})

	afterAll(() => {
		globalThis.fetch = originalFetch
	})

	beforeEach(() => {
		sent.length = 0
		generatedGlobalToken = GLOBAL_TOKEN
		credentialContract = 'normal'
	})

	/** Fails the test instead of blocking it: reading stdin without an explicit flag hangs every non-TTY caller. */
	const forbiddenStdin = () => Promise.reject(new Error('stdin must not be read'))

	const createProvider = () => {
		const remoteProjectProvider = new RemoteProjectProvider()
		remoteProjectProvider.setRemoteProject(new RemoteProject('blog', API_URL, 'test-token'))
		return new TenantClientProvider(remoteProjectProvider)
	}

	describe('TenantApiKeyListCommand', () => {
		test('--json prints a bare array on stdout', async () => {
			const { output, stdout, stderr } = createTestOutput()

			await new TenantApiKeyListCommand(createProvider()).run(['--json'], output)

			expect(JSON.parse(stdout.text)).toEqual([
				{ id: 'k1', description: null, type: 'PERMANENT', enabled: true, createdAt: null, lastUsedAt: null, expiresAt: null },
			])
			expect(stderr.text).toBe('')
		})

		test('--quiet prints only the key id', async () => {
			const { output, stdout } = createTestOutput()

			await new TenantApiKeyListCommand(createProvider()).run(['--quiet'], output)

			expect(stdout.lines).toEqual(['k1'])
		})

		test('--project lists project-scoped keys and sends the slug variable', async () => {
			const { output, stdout, stderr } = createTestOutput()

			await new TenantApiKeyListCommand(createProvider()).run(['--project', 'blog', '--json'], output)

			expect(JSON.parse(stdout.text)).toEqual([{
				id: 'project-key',
				description: 'CI',
				type: null,
				enabled: null,
				createdAt: null,
				lastUsedAt: null,
				expiresAt: null,
			}])
			expect(sent[0].variables).toEqual({ slug: 'blog' })
			expect(sent[0].query).toContain('projectBySlug')
			expect(stderr.text).toBe('')
		})

		test('--project reports a null project response as typed not-found', async () => {
			const { output } = createTestOutput()

			try {
				await new TenantApiKeyListCommand(createProvider()).run(['--project', 'missing'], output)
				throw new Error('expected a CliError to be thrown')
			} catch (e) {
				expect(e).toBeInstanceOf(CliError)
				if (e instanceof CliError) {
					expect(e.code).toBe('PROJECT_NOT_FOUND')
					expect(e.exitCode).toBe(ExitCode.NotFound)
				}
			}
		})
	})

	describe('TenantApiKeyCreateCommand', () => {
		test('--project --json: the token is in the data payload, never on stderr', async () => {
			const { output, stdout, stderr } = createTestOutput()

			await new TenantApiKeyCreateCommand(createProvider()).run(
				['--project', 'blog', '--description', 'ci key', '--memberships', '[{"role":"editor","variables":[]}]', '--json'],
				output,
			)

			expect(JSON.parse(stdout.text)).toEqual({ id: 'new-key', token: PROJECT_TOKEN })
			expect(stderr.text).toBe('')
		})

		test('human mode prints the token on stdout only, and the stderr warning names it', async () => {
			const { output, stdout, stderr } = createTestOutput()

			await new TenantApiKeyCreateCommand(createProvider()).run(
				['--global', '--description', 'root key'],
				output,
			)

			expect(stdout.text).toContain(GLOBAL_TOKEN)
			expect(stderr.text).not.toContain(GLOBAL_TOKEN)
			expect(stderr.text).toContain('shown exactly once')
		})

		test('--token-hash: no token comes back, and the stderr message explains why instead of warning', async () => {
			const { output, stdout, stderr } = createTestOutput()

			await new TenantApiKeyCreateCommand(createProvider()).run(
				['--global', '--description', 'preissued', '--token-hash', 'a'.repeat(64), '--json'],
				output,
			)

			expect(JSON.parse(stdout.text)).toEqual({ id: 'global-key', token: null })
			expect(stderr.text).toBe('')
		})

		test('--quiet prints the token scalar when the server generates it', async () => {
			const { output, stdout, stderr } = createTestOutput()

			await new TenantApiKeyCreateCommand(createProvider()).run(
				['--global', '--description', 'root key', '--quiet'],
				output,
			)

			expect(stdout.lines).toEqual([GLOBAL_TOKEN])
			expect(stderr.text).toBe('')
		})

		test('rejects a malformed generated token without printing it', async () => {
			const malformedToken = `secret\u001b]52;c;payload\u0007\r\u0085tail`
			generatedGlobalToken = malformedToken
			const { output, stdout, stderr } = createTestOutput()

			try {
				await new TenantApiKeyCreateCommand(createProvider()).run(['--global', '--description', 'root key'], output)
				throw new Error('expected malformed credential to fail')
			} catch (error) {
				expect(error).toMatchObject({ code: 'TENANT_API_INVALID_CREDENTIAL', exitCode: ExitCode.InternalError })
				expect(error instanceof Error ? error.message : '').not.toContain(malformedToken)
			}
			expect(stdout.text).toBe('')
			expect(stderr.text).toBe('')
		})

		test('requires a generated token without --token-hash in every output mode', async () => {
			credentialContract = 'missing-generated'
			for (const mode of [[], ['--quiet'], ['--json']]) {
				const { output, stdout, stderr } = createTestOutput()
				try {
					await new TenantApiKeyCreateCommand(createProvider()).run(['--global', '--description', 'root key', ...mode], output)
					throw new Error('expected missing credential to fail')
				} catch (error) {
					expect(error).toMatchObject({ code: 'TENANT_API_INVALID_CREDENTIAL', exitCode: ExitCode.InternalError })
				}
				expect(stdout.text).toBe('')
				expect(stderr.text).toBe('')
			}
		})

		test('rejects plaintext returned for --token-hash in every output mode', async () => {
			credentialContract = 'unexpected-plaintext'
			for (const mode of [[], ['--quiet'], ['--json']]) {
				const { output, stdout, stderr } = createTestOutput()
				try {
					await new TenantApiKeyCreateCommand(createProvider()).run(
						['--global', '--description', 'preissued', '--token-hash', 'a'.repeat(64), ...mode],
						output,
					)
					throw new Error('expected unexpected plaintext to fail')
				} catch (error) {
					expect(error).toMatchObject({ code: 'TENANT_API_INVALID_CREDENTIAL', exitCode: ExitCode.InternalError })
					expect(error instanceof Error ? error.message : '').not.toContain(generatedGlobalToken)
				}
				expect(stdout.text).toBe('')
				expect(stderr.text).toBe('')
			}
		})

		test('--quiet prints the id when --token-hash means no token can be returned', async () => {
			const { output, stdout, stderr } = createTestOutput()

			await new TenantApiKeyCreateCommand(createProvider()).run(
				['--global', '--description', 'preissued', '--token-hash', 'a'.repeat(64), '--quiet'],
				output,
			)

			expect(stdout.lines).toEqual(['global-key'])
			expect(stderr.text).toBe('')
		})

		test('--trust-forwarded-client-info forwards the flag and documents the spoofing boundary', async () => {
			const command = new TenantApiKeyCreateCommand(createProvider())
			const option = command.getConfiguration().getOptions().find(it => it.name === 'trust-forwarded-client-info')
			expect(option?.description).toContain('trusted proxy')
			expect(option?.description).toContain('strip')
			expect(option?.description).toContain('spoof')
			const { output } = createTestOutput()

			await command.run(
				['--global', '--description', 'proxy key', '--trust-forwarded-client-info', '--json'],
				output,
			)

			expect(isRecord(sent[0].variables) ? sent[0].variables.options : null).toEqual({ trustForwardedClientInfo: true })
		})

		test('--project and --global together are rejected', async () => {
			const { output } = createTestOutput()

			try {
				await new TenantApiKeyCreateCommand(createProvider()).run(
					['--project', 'blog', '--global', '--description', 'x'],
					output,
				)
				throw new Error('expected a CliError to be thrown')
			} catch (e) {
				expect(e).toBeInstanceOf(CliError)
				if (e instanceof CliError) {
					expect(e.code).toBe('CONFLICTING_TARGET')
					expect(e.exitCode).toBe(ExitCode.InputError)
				}
			}
		})

		test('neither --project nor --global is rejected', async () => {
			const { output } = createTestOutput()

			try {
				await new TenantApiKeyCreateCommand(createProvider()).run(['--description', 'x'], output)
				throw new Error('expected a CliError to be thrown')
			} catch (e) {
				expect(e).toBeInstanceOf(CliError)
				if (e instanceof CliError) {
					expect(e.code).toBe('TARGET_REQUIRED')
				}
			}
		})

		test('--memberships with --global is rejected', async () => {
			const { output } = createTestOutput()

			try {
				await new TenantApiKeyCreateCommand(createProvider()).run(
					['--global', '--description', 'x', '--memberships', '[]'],
					output,
				)
				throw new Error('expected a CliError to be thrown')
			} catch (e) {
				expect(e).toBeInstanceOf(CliError)
				if (e instanceof CliError) {
					expect(e.code).toBe('CONFLICTING_OPTION')
				}
			}
		})

		test('--memberships-stdin with --global is rejected too, and stdin is never touched', async () => {
			const { output } = createTestOutput()

			try {
				await new TenantApiKeyCreateCommand(createProvider(), forbiddenStdin).run(
					['--global', '--description', 'x', '--memberships-stdin'],
					output,
				)
				throw new Error('expected a CliError to be thrown')
			} catch (e) {
				expect(e).toBeInstanceOf(CliError)
				if (e instanceof CliError) {
					expect(e.code).toBe('CONFLICTING_OPTION')
				}
			}
		})

		test('--project --role is the membership shorthand shared with `tenant member`', async () => {
			const { output } = createTestOutput()

			await new TenantApiKeyCreateCommand(createProvider(), forbiddenStdin).run(
				['--project', 'blog', '--description', 'ci key', '--role', 'editor', '--role', 'reader', '--json'],
				output,
			)

			expect(isRecord(sent[0].variables) ? sent[0].variables.memberships : null).toEqual([
				{ role: 'editor', variables: [] },
				{ role: 'reader', variables: [] },
			])
		})

		test('--project --memberships-stdin reads the structure from stdin', async () => {
			const { output } = createTestOutput()

			await new TenantApiKeyCreateCommand(createProvider(), async () => '[{"role":"editor"}]').run(
				['--project', 'blog', '--description', 'ci key', '--memberships-stdin', '--json'],
				output,
			)

			expect(isRecord(sent[0].variables) ? sent[0].variables.memberships : null).toEqual([{ role: 'editor', variables: [] }])
		})

		test('a misspelled membership key is reported instead of being silently dropped', async () => {
			const { output } = createTestOutput()

			try {
				await new TenantApiKeyCreateCommand(createProvider(), forbiddenStdin).run(
					['--project', 'blog', '--description', 'x', '--memberships', '[{"role":"editor","variabels":[]}]'],
					output,
				)
				throw new Error('expected a CliError to be thrown')
			} catch (e) {
				expect(e).toBeInstanceOf(CliError)
				if (e instanceof CliError) {
					expect(e.code).toBe('INVALID_MEMBERSHIPS')
					expect(e.message).toContain('variabels')
				}
			}
		})

		/** Regression: the previous parser fell back to stdin whenever --memberships was absent, hanging every non-TTY run. */
		test('--project with no membership option fails fast and never reads stdin', async () => {
			const { output } = createTestOutput()

			try {
				await new TenantApiKeyCreateCommand(createProvider(), forbiddenStdin).run(
					['--project', 'blog', '--description', 'x'],
					output,
				)
				throw new Error('expected a CliError to be thrown')
			} catch (e) {
				expect(e).toBeInstanceOf(CliError)
				if (e instanceof CliError) {
					expect(e.code).toBe('INVALID_MEMBERSHIPS')
					expect(e.exitCode).toBe(ExitCode.InputError)
				}
			}
			expect(sent).toEqual([])
		})

		test('a missing --description is a typed input error from the parser', async () => {
			const { output } = createTestOutput()

			try {
				await new TenantApiKeyCreateCommand(createProvider()).run(['--global'], output)
				throw new Error('expected an InvalidInputError to be thrown')
			} catch (e) {
				expect(e).toBeInstanceOf(InvalidInputError)
			}
		})
	})

	describe('TenantApiKeyDisableCommand', () => {
		test('refuses to run non-interactively without --yes', async () => {
			const { output } = createTestOutput()

			try {
				await new TenantApiKeyDisableCommand(createProvider()).run(['k1'], output)
				throw new Error('expected a CliError to be thrown')
			} catch (e) {
				expect(e).toBeInstanceOf(CliError)
				if (e instanceof CliError) {
					expect(e.code).toBe('TTY_UNAVAILABLE')
				}
			}
		})

		test('--yes disables and reports the id as data without JSON diagnostics', async () => {
			const { output, stdout, stderr } = createTestOutput()

			await new TenantApiKeyDisableCommand(createProvider()).run(['k1', '--yes', '--json'], output)

			expect(JSON.parse(stdout.text)).toEqual({ id: 'k1' })
			expect(stderr.text).toBe('')
		})

		test('--yes --quiet prints only the disabled key id', async () => {
			const { output, stdout, stderr } = createTestOutput()

			await new TenantApiKeyDisableCommand(createProvider()).run(['k1', '--yes', '--quiet'], output)

			expect(stdout.lines).toEqual(['k1'])
			expect(stderr.text).toBe('')
		})
	})
})

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const json = (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 })
