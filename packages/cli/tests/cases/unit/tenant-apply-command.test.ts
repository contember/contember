import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { CliError, ExitCode } from '@contember/cli-common'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import { TenantApplyCommand } from '../../../src/commands/tenant/TenantApplyCommand.js'
import { RemoteProjectResolver } from '../../../src/lib/project/RemoteProjectResolver.js'
import { TenantConfigApplier } from '../../../src/lib/tenant/TenantConfigApplier.js'
import { TenantConfigLoader } from '../../../src/lib/tenant/TenantConfigLoader.js'
import { TenantConfig } from '../../../src/lib/tenant/tenantConfig.js'

const config: TenantConfig = {
	config: { password: { minLength: 8 } },
	identityProviders: { google: { type: 'oidc', configuration: {} } },
	mailTemplates: [{ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c' }],
}

const API_URL = 'http://tenant.test'

/**
 * The command builds its own transport, so the network is stubbed at the global `fetch` — a real socket is
 * not an option here, the bun test preload registers happy-dom and its `fetch` cannot talk to `Bun.serve`.
 */
const requestedUrls: string[] = []
const requestedVariables: Record<string, unknown>[] = []
let existingAuthPolicies: Record<string, unknown>[] = []
let persistedCaptchaSecret: string | null = 'stored-secret'
let persistedCaptchaSecretVersion: number | null = 7
const originalFetch = globalThis.fetch

beforeAll(() => {
	globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		requestedUrls.push(String(input))
		const { query, variables }: { query: string; variables: Record<string, unknown> } = JSON.parse(String(init?.body))
		requestedVariables.push(variables)
		if (query.includes('configure')) {
			applyCaptchaSecretEffect(variables)
		}
		const data = query.startsWith('query')
			? (query.includes('authPolicies') ? { authPolicies: existingAuthPolicies } : { identityProviders: [] })
			: { [['configure', 'addIDP', 'addMailTemplate'].find(it => query.includes(it)) ?? 'unknown']: { ok: true } }
		return new Response(JSON.stringify({ data }), { status: 200 })
	}
})

afterAll(() => {
	globalThis.fetch = originalFetch
})

beforeEach(() => {
	requestedUrls.length = 0
	requestedVariables.length = 0
	existingAuthPolicies = []
	persistedCaptchaSecret = 'stored-secret'
	persistedCaptchaSecretVersion = 7
})

const applyCaptchaSecretEffect = (variables: Record<string, unknown>): void => {
	const config = toRecord(variables.config)
	const captcha = toRecord(config?.captcha)
	if (captcha === undefined || !Object.prototype.hasOwnProperty.call(captcha, 'secret')) {
		return
	}
	if (captcha.secret === '') {
		persistedCaptchaSecret = null
		persistedCaptchaSecretVersion = null
		return
	}
	if (typeof captcha.secret === 'string') {
		persistedCaptchaSecret = captcha.secret
		persistedCaptchaSecretVersion = (persistedCaptchaSecretVersion ?? 0) + 1
	}
}

const toRecord = (value: unknown): Record<string, unknown> | undefined => {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return undefined
	}
	const record: Record<string, unknown> = {}
	for (const [key, item] of Object.entries(value)) {
		record[key] = item
	}
	return record
}

const createCommand = ({ withProject = true, tenantConfig = config }: { withProject?: boolean; tenantConfig?: TenantConfig } = {}) => {
	const env = withProject ? { apiUrl: API_URL, apiToken: 'token', projectName: 'blog' } : {}
	const loader: TenantConfigLoader = { loadConfig: async () => tenantConfig }
	const testOutput = createTestOutput()
	const command = new TenantApplyCommand(new RemoteProjectResolver(env), loader, new TenantConfigApplier(testOutput.output))
	return { command, ...testOutput }
}

const expectedPlan = [
	{ action: 'configure', target: null },
	{ action: 'addIdp', target: 'google' },
	{ action: 'addMailTemplate', target: 'RESET_PASSWORD_REQUEST' },
]

describe('TenantApplyCommand', () => {
	test('--json prints a structured apply result on stdout', async () => {
		const { command, output, stdout, stderr } = createCommand()

		await command.run(['--dry-run', '--json'], output)

		expect(JSON.parse(stdout.text)).toEqual({ configPath: 'tenant.config.ts', dryRun: true, actions: expectedPlan, warnings: [] })
		expect(stderr.text).toBe('')
	})

	// output.warn writes nothing outside human mode, so an unmanaged policy would otherwise be
	// invisible to exactly the callers this contract exists for
	test('--json carries an unmanaged auth policy that stderr cannot report', async () => {
		existingAuthPolicies = [{ id: 'stale', scope: 'global', project: null, roles: ['old_role'] }]
		const { command, output, stdout, stderr } = createCommand({ tenantConfig: { authPolicies: [] } })

		await command.run(['--json'], output)

		expect(JSON.parse(stdout.text).warnings).toEqual([{
			code: 'UNMANAGED_AUTH_POLICY',
			target: 'global [old_role]',
			message: 'Auth policy global [old_role] exists but is not in the config; it stays in effect.',
		}])
		expect(stderr.text).toBe('')
	})

	test('human mode keeps the diagnostics on stderr and the plan on stdout', async () => {
		const { command, output, stdout, stderr } = createCommand()

		await command.run(['--dry-run'], output)

		expect(stdout.text).toContain('configure')
		expect(stdout.text).not.toContain('API URL')
		expect(stderr.text).toContain(`API URL: ${API_URL}`)
	})

	test('--quiet prints stable scalar action references', async () => {
		const { command, output, stdout, stderr } = createCommand()

		await command.run(['--dry-run', '--quiet'], output)

		expect(stdout.lines).toEqual(['configure', 'addIdp:google', 'addMailTemplate:RESET_PASSWORD_REQUEST'])
		expect(stderr.text).toBe('')
	})

	// the regression this guards: with `progress()` a non-TTY (CI) run left no record of what was touched
	test('a real run without a TTY still reports every action on stderr, and stdout stays pure data', async () => {
		const { command, output, stdout, stderr } = createCommand()

		await command.run([], output)

		expect(stderr.lines).toEqual([
			'Applying tenant config from tenant.config.ts',
			`API URL: ${API_URL}`,
			'configure',
			'addIdp: google',
			'addMailTemplate: RESET_PASSWORD_REQUEST',
			'Tenant configuration applied.',
		])
		expect(stdout.text).toContain('configure')
		expect(stdout.text).not.toContain('API URL')
		expect(requestedUrls).toContain(`${API_URL}/tenant`)
	})

	test('a real run with --json keeps stderr empty and stdout parseable', async () => {
		const { command, output, stdout, stderr } = createCommand()

		await command.run(['--json'], output)

		expect(JSON.parse(stdout.text)).toEqual({ configPath: 'tenant.config.ts', dryRun: false, actions: expectedPlan, warnings: [] })
		expect(stderr.text).toBe('')
	})

	test('explicit captcha secret null preserves the stored secret and version', async () => {
		const tenantConfig: TenantConfig = {
			config: {
				password: { pattern: null },
				captcha: { provider: null, secret: null, threshold: null },
			},
		}
		const { command, output } = createCommand({ tenantConfig })

		await command.run(['--json'], output)

		expect(requestedVariables).toEqual([{
			config: {
				password: { pattern: null },
				captcha: { provider: null, secret: null, threshold: null },
			},
		}])
		expect(persistedCaptchaSecret).toBe('stored-secret')
		expect(persistedCaptchaSecretVersion).toBe(7)
	})

	test('captcha secret null alone skips configure and continues with later actions', async () => {
		const tenantConfig: TenantConfig = {
			config: { captcha: { secret: null } },
			identityProviders: { google: { type: 'oidc', configuration: {} } },
			mailTemplates: [{ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c' }],
		}
		const { command, output, stdout } = createCommand({ tenantConfig })

		await command.run(['--json'], output)

		expect(requestedVariables).toEqual([
			{},
			{ identityProvider: 'google', type: 'oidc', configuration: {}, options: undefined },
			{ template: { type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c' } },
		])
		expect(JSON.parse(stdout.text).actions).toEqual([
			{ action: 'addIdp', target: 'google' },
			{ action: 'addMailTemplate', target: 'RESET_PASSWORD_REQUEST' },
		])
		expect(persistedCaptchaSecret).toBe('stored-secret')
		expect(persistedCaptchaSecretVersion).toBe(7)
	})

	test('an empty captcha secret clears the stored secret and version', async () => {
		const { command, output } = createCommand({ tenantConfig: { config: { captcha: { secret: '' } } } })

		await command.run(['--json'], output)

		expect(persistedCaptchaSecret).toBeNull()
		expect(persistedCaptchaSecretVersion).toBeNull()
	})

	test('nested empty config objects do not trigger an empty configure mutation', async () => {
		const { command, output, stdout } = createCommand({ tenantConfig: { config: { password: {} } } })

		await command.run(['--json'], output)

		expect(requestedUrls).toEqual([])
		expect(JSON.parse(stdout.text)).toEqual({ configPath: 'tenant.config.ts', dryRun: false, actions: [], warnings: [] })
	})

	test('an unresolvable project is a typed input error', async () => {
		const { command, output } = createCommand({ withProject: false })

		try {
			await command.run(['--dry-run'], output)
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('PROJECT_NOT_DEFINED')
				expect(e.exitCode).toBe(ExitCode.InputError)
			}
		}
	})
})
