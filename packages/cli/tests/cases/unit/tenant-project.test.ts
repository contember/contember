import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { CliError, ExitCode } from '@contember/cli-common'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import { TenantClientProvider } from '../../../src/lib/TenantClientProvider.js'
import { RemoteProject } from '../../../src/lib/project/RemoteProject.js'
import { RemoteProjectProvider } from '../../../src/lib/project/RemoteProjectProvider.js'
import { TenantConfigShowCommand } from '../../../src/commands/tenant/project/TenantConfigShowCommand.js'
import { TenantIdpListCommand } from '../../../src/commands/tenant/project/TenantIdpListCommand.js'
import { TenantProjectCreateCommand } from '../../../src/commands/tenant/project/TenantProjectCreateCommand.js'
import { TenantProjectListCommand } from '../../../src/commands/tenant/project/TenantProjectListCommand.js'
import { TenantProjectSecretSetCommand } from '../../../src/commands/tenant/project/TenantProjectSecretSetCommand.js'
import { TenantProjectShowCommand } from '../../../src/commands/tenant/project/TenantProjectShowCommand.js'
import { TenantProjectUpdateCommand } from '../../../src/commands/tenant/project/TenantProjectUpdateCommand.js'
import { TenantWhoAmICommand } from '../../../src/commands/tenant/project/TenantWhoAmICommand.js'

const API_URL = 'http://tenant.test'
const GENERATED_TOKEN = 'a'.repeat(40)

interface CapturedRequest {
	query: string
	variables: unknown
}

/**
 * The commands build their own transport via `TenantClientProvider`, so the network is stubbed at the
 * global `fetch` — see `tenant-apply-command.test.ts` for why a real socket is not an option here.
 * Each test sets `responder` right before running its command, so there is no query-sniffing router
 * to keep in sync with every operation name.
 */
let responder: (query: string, variables: unknown) => unknown = () => {
	throw new Error('no responder configured for this test')
}
const requests: CapturedRequest[] = []
const originalFetch = globalThis.fetch

beforeAll(() => {
	globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
		const { query, variables }: { query: string; variables: unknown } = JSON.parse(String(init?.body))
		requests.push({ query, variables })
		return new Response(JSON.stringify({ data: responder(query, variables) }), { status: 200 })
	}
})

afterAll(() => {
	globalThis.fetch = originalFetch
})

beforeEach(() => {
	requests.length = 0
})

const createTenantClientProvider = (): TenantClientProvider => {
	const remoteProjectProvider = new RemoteProjectProvider()
	remoteProjectProvider.setRemoteProject(new RemoteProject('blog', API_URL, 'token'))
	return new TenantClientProvider(remoteProjectProvider)
}

describe('TenantProjectListCommand ("tenant project list")', () => {
	test('--json prints a bare array on stdout', async () => {
		responder = () => ({ projects: [{ id: 'p1', name: 'Blog', slug: 'blog' }] })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantProjectListCommand(createTenantClientProvider()).run(['--json'], output)

		expect(JSON.parse(stdout.text)).toEqual([{ id: 'p1', name: 'Blog', slug: 'blog' }])
		expect(stderr.text).toBe('')
	})

	test('--quiet prints bare slugs, one per line', async () => {
		responder = () => ({ projects: [{ id: 'p1', name: 'Blog', slug: 'blog' }, { id: 'p2', name: 'Shop', slug: 'shop' }] })
		const { output, stdout } = createTestOutput()

		await new TenantProjectListCommand(createTenantClientProvider()).run(['--quiet'], output)

		expect(stdout.lines).toEqual(['blog', 'shop'])
	})
})

describe('TenantProjectShowCommand ("tenant project show")', () => {
	test('--json prints the project, including role variable names and secret metadata', async () => {
		responder = () => ({
			projectBySlug: {
				id: 'p1',
				name: 'Blog',
				slug: 'blog',
				config: { foo: 1 },
				roles: [{
					name: 'editor',
					variables: [
						{ __typename: 'RoleEntityVariableDefinition', name: 'author', entityName: 'Author' },
						{ __typename: 'RolePredefinedVariableDefinition', name: 'language', value: 'cs' },
						{ __typename: 'RoleConditionVariableDefinition', name: 'published' },
					],
				}],
				secrets: [{ key: 'API_KEY', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' }],
			},
		})
		const { output, stdout } = createTestOutput()

		await new TenantProjectShowCommand(createTenantClientProvider()).run(['blog', '--json'], output)

		expect(JSON.parse(stdout.text)).toEqual({
			id: 'p1',
			name: 'Blog',
			slug: 'blog',
			config: { foo: 1 },
			roles: [{
				name: 'editor',
				variables: ['author', 'language', 'published'],
				variableDefinitions: [
					{ type: 'entity', name: 'author', entityName: 'Author' },
					{ type: 'predefined', name: 'language', value: 'cs' },
					{ type: 'condition', name: 'published' },
				],
			}],
			secrets: [{ key: 'API_KEY', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' }],
		})
		expect(requests[0].variables).toEqual({ slug: 'blog' })
		expect(requests[0].query).toContain('__typename')
		expect(requests[0].query).toContain('entityName')
		expect(requests[0].query).toContain('value')
	})

	test('human output retains role variable definition metadata', async () => {
		responder = () => ({
			projectBySlug: {
				id: 'p1',
				name: 'Blog',
				slug: 'blog',
				config: {},
				roles: [{ name: 'editor', variables: [{ __typename: 'RoleEntityVariableDefinition', name: 'author', entityName: 'Author' }] }],
				secrets: [],
			},
		})
		const { output, stdout } = createTestOutput()

		await new TenantProjectShowCommand(createTenantClientProvider()).run(['blog'], output)

		expect(stdout.text).toContain('variableDefinitions')
		expect(stdout.text).toContain('entityName')
		expect(stdout.text).toContain('Author')
	})

	test('rejects an abstract role variable definition as an invalid tenant response', async () => {
		responder = () => ({
			projectBySlug: {
				id: 'p1',
				name: 'Blog',
				slug: 'blog',
				config: {},
				roles: [{ name: 'editor', variables: [{ __typename: 'RoleVariableDefinition', name: 'unknown' }] }],
				secrets: [],
			},
		})
		const { output } = createTestOutput()

		try {
			await new TenantProjectShowCommand(createTenantClientProvider()).run(['blog'], output)
			throw new Error('expected a CliError to be thrown')
		} catch (error) {
			expect(error).toBeInstanceOf(CliError)
			if (error instanceof CliError) {
				expect(error.code).toBe('TENANT_API_INVALID_RESPONSE')
				expect(error.exitCode).toBe(ExitCode.InternalError)
			}
		}
	})

	// a missing project and a forbidden one are indistinguishable at the API — both surface as a typed not-found
	test('a missing project is reported as PROJECT_NOT_FOUND, not a bare null on stdout', async () => {
		responder = () => ({ projectBySlug: null })
		const { output } = createTestOutput()

		try {
			await new TenantProjectShowCommand(createTenantClientProvider()).run(['ghost'], output)
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

describe('TenantProjectCreateCommand ("tenant project create")', () => {
	test('--json keeps the issued deploy token in the structured result and diagnostics empty', async () => {
		responder = () => ({ createProject: { ok: true, result: { deployerApiKey: { id: 'k1', token: GENERATED_TOKEN } } } })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantProjectCreateCommand(createTenantClientProvider()).run(['blog', '--name', 'Blog', '--config', '{"foo":1}', '--json'], output)

		expect(requests[0].variables).toEqual({ projectSlug: 'blog', name: 'Blog', config: { foo: 1 } })
		expect(JSON.parse(stdout.text)).toEqual({ slug: 'blog', created: true, deployerApiKey: { id: 'k1', token: GENERATED_TOKEN } })
		expect(stderr.text).toBe('')
	})

	test('human mode prints the one-time deployer token on stdout and never copies it to diagnostics', async () => {
		responder = () => ({ createProject: { ok: true, result: { deployerApiKey: { id: 'k1', token: GENERATED_TOKEN } } } })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantProjectCreateCommand(createTenantClientProvider()).run(['blog'], output)

		expect(stdout.text).toContain('Project "blog" created.')
		expect(stdout.text).toContain(`Deployer token: ${GENERATED_TOKEN}`)
		expect(stderr.text).toContain('shown exactly once')
		expect(stderr.text).not.toContain(GENERATED_TOKEN)
	})

	test('--quiet prints only the one-time deployer token', async () => {
		responder = () => ({ createProject: { ok: true, result: { deployerApiKey: { id: 'k1', token: GENERATED_TOKEN } } } })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantProjectCreateCommand(createTenantClientProvider()).run(['blog', '--quiet'], output)

		expect(stdout.lines).toEqual([GENERATED_TOKEN])
		expect(stderr.text).toBe('')
	})

	test('rejects a malformed deployer token without printing it', async () => {
		const malformedToken = `secret\u001b]8;;https://attacker.test\u0007\r\u0085tail`
		responder = () => ({ createProject: { ok: true, result: { deployerApiKey: { id: 'k1', token: malformedToken } } } })
		const { output, stdout, stderr } = createTestOutput()

		try {
			await new TenantProjectCreateCommand(createTenantClientProvider()).run(['blog'], output)
			throw new Error('expected malformed credential to fail')
		} catch (error) {
			expect(error).toMatchObject({ code: 'TENANT_API_INVALID_CREDENTIAL', exitCode: ExitCode.InternalError })
			expect(error instanceof Error ? error.message : '').not.toContain(malformedToken)
		}
		expect(stdout.text).toBe('')
		expect(stderr.text).toBe('')
	})

	test('requires a deployer key and token for each newly created default project in every output mode', async () => {
		for (const deployerApiKey of [null, { id: 'k1' }]) {
			for (const mode of [[], ['--quiet'], ['--json']]) {
				responder = () => ({ createProject: { ok: true, result: { deployerApiKey } } })
				const { output, stdout, stderr } = createTestOutput()
				try {
					await new TenantProjectCreateCommand(createTenantClientProvider()).run(['blog', ...mode], output)
					throw new Error('expected missing deployer credential to fail')
				} catch (error) {
					expect(error).toMatchObject({ code: 'TENANT_API_INVALID_CREDENTIAL', exitCode: ExitCode.InternalError })
				}
				expect(stdout.text).toBe('')
				expect(stderr.text).toBe('')
			}
		}
	})

	test('requires --no-deploy-token responses to omit the deployer key in every output mode', async () => {
		for (const mode of [[], ['--quiet'], ['--json']]) {
			responder = () => ({ createProject: { ok: true, result: { deployerApiKey: { id: 'k1', token: GENERATED_TOKEN } } } })
			const { output, stdout, stderr } = createTestOutput()
			try {
				await new TenantProjectCreateCommand(createTenantClientProvider()).run(['blog', '--no-deploy-token', ...mode], output)
				throw new Error('expected unexpected deployer credential to fail')
			} catch (error) {
				expect(error).toMatchObject({ code: 'TENANT_API_INVALID_CREDENTIAL', exitCode: ExitCode.InternalError })
				expect(error instanceof Error ? error.message : '').not.toContain(GENERATED_TOKEN)
			}
			expect(stdout.text).toBe('')
			expect(stderr.text).toBe('')
		}
	})

	test('--config-stdin reads the config JSON from stdin', async () => {
		responder = () => ({ createProject: { ok: true, result: { deployerApiKey: { id: 'k1', token: GENERATED_TOKEN } } } })
		const { output, stdout } = createTestOutput()
		const readStdin = async () => '{"bar":2}'

		await new TenantProjectCreateCommand(createTenantClientProvider(), readStdin).run(['blog', '--config-stdin', '--json'], output)

		expect(requests[0].variables).toMatchObject({ config: { bar: 2 } })
		expect(JSON.parse(stdout.text).deployerApiKey).toEqual({ id: 'k1', token: GENERATED_TOKEN })
	})

	test('--if-not-exists treats ALREADY_EXISTS as no creation, so no deployer credential is expected', async () => {
		responder = () => ({ createProject: { ok: false, error: { code: 'ALREADY_EXISTS', developerMessage: 'exists' } } })
		const { output, stdout } = createTestOutput()

		await new TenantProjectCreateCommand(createTenantClientProvider()).run(['blog', '--if-not-exists', '--json'], output)

		expect(JSON.parse(stdout.text)).toEqual({ slug: 'blog', created: false, deployerApiKey: null })
	})

	test('--no-deploy-token is forwarded as options.noDeployToken', async () => {
		responder = () => ({ createProject: { ok: true } })
		const { output } = createTestOutput()

		await new TenantProjectCreateCommand(createTenantClientProvider()).run(['blog', '--no-deploy-token'], output)

		expect(requests[0].variables).toEqual({ projectSlug: 'blog', options: { noDeployToken: true } })
	})
})

describe('TenantProjectUpdateCommand ("tenant project update")', () => {
	test('sends name, config and mergeConfig, and echoes the applied change on stdout', async () => {
		responder = () => ({ updateProject: { ok: true } })
		const { output, stdout } = createTestOutput()

		await new TenantProjectUpdateCommand(createTenantClientProvider()).run([
			'blog',
			'--name',
			'New name',
			'--config',
			'{"a":1}',
			'--merge-config',
			'--json',
		], output)

		expect(requests[0].variables).toEqual({ projectSlug: 'blog', name: 'New name', config: { a: 1 }, mergeConfig: true })
		expect(JSON.parse(stdout.text)).toEqual({ slug: 'blog', name: 'New name', config: { a: 1 }, mergeConfig: true })
	})

	test('--quiet prints only the updated project slug', async () => {
		responder = () => ({ updateProject: { ok: true } })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantProjectUpdateCommand(createTenantClientProvider()).run(['blog', '--name', 'New name', '--quiet'], output)

		expect(stdout.lines).toEqual(['blog'])
		expect(stderr.text).toBe('')
	})

	test('with neither --name nor --config, refuses with NO_UPDATE_FIELDS instead of sending an empty mutation', async () => {
		const { output } = createTestOutput()

		try {
			await new TenantProjectUpdateCommand(createTenantClientProvider()).run(['blog'], output)
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('NO_UPDATE_FIELDS')
				expect(e.exitCode).toBe(ExitCode.InputError)
			}
		}
	})

	test('--merge-config without --config is rejected before any request is sent', async () => {
		const { output } = createTestOutput()

		try {
			await new TenantProjectUpdateCommand(createTenantClientProvider()).run(['blog', '--merge-config'], output)
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('MERGE_CONFIG_WITHOUT_CONFIG')
			}
		}
	})

	test('invalid --config JSON is a typed input error naming the option', async () => {
		const { output } = createTestOutput()

		try {
			await new TenantProjectUpdateCommand(createTenantClientProvider()).run(['blog', '--config', '{not json'], output)
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('INVALID_CONFIG_JSON')
				expect(e.exitCode).toBe(ExitCode.InputError)
			}
		}
	})

	test('--config and --config-stdin together are rejected before any request is sent', async () => {
		const { output } = createTestOutput()
		const readStdin = async () => '{}'

		try {
			await new TenantProjectUpdateCommand(createTenantClientProvider(), readStdin).run(['blog', '--config', '{}', '--config-stdin'], output)
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('CONFIG_CONFLICTING_SOURCE')
			}
		}
		expect(requests.length).toBe(0)
	})
})

describe('TenantProjectSecretSetCommand ("tenant project secret set")', () => {
	test('--value preserves every byte and never reads stdin', async () => {
		responder = () => ({ setProjectSecret: { ok: true } })
		const { output, stdout, stderr } = createTestOutput()
		const readStdin = async (): Promise<string> => {
			throw new Error('stdin must not be read when --value is given')
		}
		const secret = '  literal secret\n\n '

		await new TenantProjectSecretSetCommand(createTenantClientProvider(), readStdin).run(['blog', 'API_KEY', '--value', secret, '--json'], output)

		expect(requests[0].variables).toEqual({ projectSlug: 'blog', key: 'API_KEY', value: secret })
		expect(JSON.parse(stdout.text)).toEqual({ slug: 'blog', key: 'API_KEY' })
		expect(stdout.text).not.toContain(secret)
		expect(stderr.text).toBe('')
	})

	test('--value-stdin removes exactly one trailing CRLF and preserves all other whitespace', async () => {
		responder = () => ({ setProjectSecret: { ok: true } })
		const { output, stdout, stderr } = createTestOutput()
		const readStdin = async () => '  piped-secret  \n\r\n'

		await new TenantProjectSecretSetCommand(createTenantClientProvider(), readStdin).run(['blog', 'API_KEY', '--value-stdin', '--json'], output)

		expect(requests[0].variables).toEqual({ projectSlug: 'blog', key: 'API_KEY', value: '  piped-secret  \n' })
		expect(JSON.parse(stdout.text)).toEqual({ slug: 'blog', key: 'API_KEY' })
		expect(stdout.text).not.toContain('piped-secret')
		expect(stderr.text).not.toContain('piped-secret')
	})

	test('--value-env preserves the environment value exactly and does not expose it', async () => {
		responder = () => ({ setProjectSecret: { ok: true } })
		const { output, stdout, stderr } = createTestOutput()
		const secret = '  environment secret\n\n '
		process.env.CONTEMBER_CLI_SECRET_TEST = secret
		try {
			await new TenantProjectSecretSetCommand(createTenantClientProvider()).run(
				['blog', 'API_KEY', '--value-env', 'CONTEMBER_CLI_SECRET_TEST', '--json'],
				output,
			)
		} finally {
			delete process.env.CONTEMBER_CLI_SECRET_TEST
		}

		expect(requests[0].variables).toEqual({ projectSlug: 'blog', key: 'API_KEY', value: secret })
		expect(stdout.text).not.toContain(secret)
		expect(stderr.text).not.toContain(secret)
	})

	test('no source fails before reading stdin or sending a request', async () => {
		const { output } = createTestOutput()
		const readStdin = async (): Promise<string> => {
			throw new Error('stdin must not be read without --value-stdin')
		}

		try {
			await new TenantProjectSecretSetCommand(createTenantClientProvider(), readStdin).run(['blog', 'API_KEY'], output)
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('MISSING_INPUT_SOURCE')
				expect(e.exitCode).toBe(ExitCode.InputError)
			}
		}
		expect(requests.length).toBe(0)
	})

	test('ambiguous sources fail before reading stdin or sending a request', async () => {
		const { output } = createTestOutput()
		const readStdin = async (): Promise<string> => {
			throw new Error('stdin must not be read for ambiguous sources')
		}

		try {
			await new TenantProjectSecretSetCommand(createTenantClientProvider(), readStdin).run(
				['blog', 'API_KEY', '--value', 'literal-secret', '--value-stdin'],
				output,
			)
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('AMBIGUOUS_INPUT_SOURCE')
				expect(e.message).not.toContain('literal-secret')
			}
		}
		expect(requests.length).toBe(0)
	})

	test('stdin containing only one line ending is rejected before the request', async () => {
		const { output } = createTestOutput()

		try {
			await new TenantProjectSecretSetCommand(createTenantClientProvider(), async () => '\r\n').run(
				['blog', 'API_KEY', '--value-stdin'],
				output,
			)
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('EMPTY_INPUT_VALUE')
			}
		}
		expect(requests.length).toBe(0)
	})

	test('--quiet prints only the secret key, never the secret', async () => {
		responder = () => ({ setProjectSecret: { ok: true } })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantProjectSecretSetCommand(createTenantClientProvider()).run(
			['blog', 'API_KEY', '--value', 'quiet-secret', '--quiet'],
			output,
		)

		expect(stdout.lines).toEqual(['API_KEY'])
		expect(stdout.text).not.toContain('quiet-secret')
		expect(stderr.text).toBe('')
	})

	test('human result removes terminal controls while JSON keeps the raw project and key', async () => {
		responder = () => ({ setProjectSecret: { ok: true } })
		const unsafeSlug = `blog\u001b]8;;https://attacker.test\u0007`
		const unsafeKey = `KEY\r\u0085tail`
		const human = createTestOutput()

		await new TenantProjectSecretSetCommand(createTenantClientProvider()).run([unsafeSlug, unsafeKey, '--value', 'secret'], human.output)

		for (const control of ['\u001b', '\u0007', '\r', '\u0085']) {
			expect(human.stdout.text).not.toContain(control)
		}
		const jsonOutput = createTestOutput()
		await new TenantProjectSecretSetCommand(createTenantClientProvider()).run(
			[unsafeSlug, unsafeKey, '--value', 'secret', '--json'],
			jsonOutput.output,
		)
		expect(JSON.parse(jsonOutput.stdout.text)).toEqual({ slug: unsafeSlug, key: unsafeKey })
	})
})

describe('TenantConfigShowCommand ("tenant config show")', () => {
	test('--json prints the full nested config with optional leaves normalized to null', async () => {
		responder = () => ({
			configuration: {
				signup: { requireEmailVerification: true },
				emailChange: { requireVerification: false },
				passwordless: { enabled: 'optIn', expiration: 'PT15M' },
				password: { minLength: 8, requireUppercase: 0, requireLowercase: 0, requireDigit: 0, requireSpecial: 0, checkBlacklist: true, checkHibp: false },
				login: {
					baseBackoff: 'PT1S',
					maxBackoff: 'PT1H',
					attemptWindow: 'PT10M',
					revealUserExists: true,
					revealLoginMethod: true,
					defaultTokenExpiration: 'PT30M',
					mfaGraceDuration: 'P0D',
					anomalyDetection: { enabled: false, historySize: 10, emailThreshold: 5, stepUpThreshold: 8 },
				},
				captcha: { protect: { signUp: false, passwordReset: false, passwordlessInit: false, emailVerification: false } },
				rateLimits: {
					signUpPerIp: { limit: 10, window: 'PT1H' },
					loginPerIp: { limit: 10, window: 'PT1H' },
					passwordResetPerIp: { limit: 10, window: 'PT1H' },
					passwordlessInitPerIp: { limit: 10, window: 'PT1H' },
					emailOtpPerPerson: { limit: 10, window: 'PT1H' },
					emailVerificationPerIp: { limit: 10, window: 'PT1H' },
				},
			},
		})
		const { output, stdout } = createTestOutput()

		await new TenantConfigShowCommand(createTenantClientProvider()).run(['--json'], output)

		const parsed = JSON.parse(stdout.text)
		expect(parsed.passwordless).toEqual({ enabled: 'optIn', url: null, expiration: 'PT15M' })
		expect(parsed.password.pattern).toBeNull()
		expect(parsed.login.maxTokenExpiration).toBeNull()
		expect(parsed.captcha).toEqual({
			provider: null,
			threshold: null,
			protect: { signUp: false, passwordReset: false, passwordlessInit: false, emailVerification: false },
		})
		expect(parsed.rateLimits.loginPerIp).toEqual({ limit: 10, window: 'PT1H' })
	})
})

describe('TenantIdpListCommand ("tenant idp list")', () => {
	test('--json prints a bare array, reusing the kernel client', async () => {
		responder = () => ({ identityProviders: [{ slug: 'google', type: 'oidc' }] })
		const { output, stdout } = createTestOutput()

		await new TenantIdpListCommand(createTenantClientProvider()).run(['--json'], output)

		expect(JSON.parse(stdout.text)).toEqual([{ slug: 'google', type: 'oidc', disabledAt: null }])
	})
})

describe('TenantWhoAmICommand ("tenant whoami")', () => {
	test('--json prints identity, permissions and per-project roles', async () => {
		responder = () => ({
			me: {
				id: 'i1',
				description: 'root token',
				roles: ['super_admin'],
				permissions: { canCreateProject: true, canDeployEntrypoint: true },
				projects: [{ project: { slug: 'blog', name: 'Blog' }, memberships: [{ role: 'admin' }] }],
			},
		})
		const { output, stdout } = createTestOutput()

		await new TenantWhoAmICommand(createTenantClientProvider()).run(['--json'], output)

		expect(JSON.parse(stdout.text)).toEqual({
			id: 'i1',
			description: 'root token',
			roles: ['super_admin'],
			permissions: { canCreateProject: true, canDeployEntrypoint: true },
			projects: [{ slug: 'blog', name: 'Blog', roles: ['admin'] }],
		})
	})
})
