import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { CliError, ExitCode } from '@contember/cli-common'
import { GraphQlClient } from '@contember/graphql-client'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import { TenantAuthLogCommand } from '../../../src/commands/tenant/policy/TenantAuthLogCommand.js'
import { TenantMailTemplateAddCommand } from '../../../src/commands/tenant/policy/TenantMailTemplateAddCommand.js'
import { TenantMailTemplateListCommand } from '../../../src/commands/tenant/policy/TenantMailTemplateListCommand.js'
import { TenantMailTemplateRemoveCommand } from '../../../src/commands/tenant/policy/TenantMailTemplateRemoveCommand.js'
import { TenantPolicyCreateCommand } from '../../../src/commands/tenant/policy/TenantPolicyCreateCommand.js'
import { TenantPolicyDeleteCommand } from '../../../src/commands/tenant/policy/TenantPolicyDeleteCommand.js'
import { TenantPolicyListCommand } from '../../../src/commands/tenant/policy/TenantPolicyListCommand.js'
import { TenantPolicyUpdateCommand } from '../../../src/commands/tenant/policy/TenantPolicyUpdateCommand.js'
import { StdinReader } from '../../../src/commands/tenant/policy/policyInput.js'
import { RemoteProject } from '../../../src/lib/project/RemoteProject.js'
import { RemoteProjectProvider } from '../../../src/lib/project/RemoteProjectProvider.js'
import { TenantClientProvider } from '../../../src/lib/TenantClientProvider.js'
import { TenantApiTransport } from '../../../src/lib/tenant/TenantApiTransport.js'
import { createTenantClients } from '../../../src/lib/tenant/clients/index.js'

const API_URL = 'http://tenant.test'

interface CapturedRequest {
	query: string
	variables: Record<string, unknown>
}

/** Answers every request with `data`, capturing what was sent. See clients/README.md. */
const createClients = (data: unknown) => {
	const requests: CapturedRequest[] = []
	const client = new GraphQlClient({
		url: `${API_URL}/tenant`,
		fetcher: async (input, init) => {
			const { query, variables }: { query: string; variables: Record<string, unknown> } = JSON.parse(String(init?.body))
			requests.push({ query, variables })
			return new Response(JSON.stringify({ data }), { status: 200 })
		},
	})
	return { clients: createTenantClients(new TenantApiTransport(client)), requests }
}

const policyRow = {
	id: 'pol-1',
	scope: 'project',
	project: 'blog',
	roles: ['editor', 'admin'],
	mfaRequired: true,
	tokenExpiration: 'PT1H',
}

const authLogRow = {
	id: 'log-1',
	createdAt: '2026-08-10T12:34:56.000Z',
	type: 'sign_in',
	success: false,
	personInputIdentifier: 'a@b.cz',
	errorCode: 'INVALID_CREDENTIALS',
	ipAddress: '10.0.0.1',
}

const mailTemplateRow = {
	type: 'RESET_PASSWORD_REQUEST',
	subject: 'Reset',
	content: 'Hello {{name}}, follow the link.',
	useLayout: true,
}

describe('TenantPolicyClient', () => {
	test('listAuthPolicies normalizes every nullable field', async () => {
		const { clients } = createClients({ authPolicies: [policyRow] })

		expect(await clients.policy.listAuthPolicies()).toEqual([{
			id: 'pol-1',
			scope: 'project',
			project: 'blog',
			roles: ['editor', 'admin'],
			mfaRequired: true,
			tokenExpiration: 'PT1H',
			idleTimeout: null,
			mfaGraceDuration: null,
			rememberMeAllowed: null,
		}])
	})

	test('createAuthPolicy returns the new id', async () => {
		const { clients, requests } = createClients({ createAuthPolicy: { ok: true, result: { id: 'pol-9' } } })

		expect(await clients.policy.createAuthPolicy({ scope: 'global', roles: ['admin'] })).toBe('pol-9')
		expect(requests[0].variables).toEqual({ policy: { scope: 'global', roles: ['admin'] } })
	})

	test('createAuthPolicy reports a payload error with the tenant code', async () => {
		const { clients } = createClients({ createAuthPolicy: { ok: false, error: { code: 'PROJECT_NOT_FOUND', developerMessage: 'nope' } } })

		try {
			await clients.policy.createAuthPolicy({ scope: 'project', project: 'ghost', roles: [] })
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('PROJECT_NOT_FOUND')
				expect(e.exitCode).toBe(ExitCode.NotFound)
			}
		}
	})

	test('createAuthPolicy treats PROJECT_NOT_ALLOWED as invalid input', async () => {
		const { clients } = createClients({
			createAuthPolicy: { ok: false, error: { code: 'PROJECT_NOT_ALLOWED', developerMessage: 'global policies have no project' } },
		})

		try {
			await clients.policy.createAuthPolicy({ scope: 'global', project: 'blog', roles: [] })
			throw new Error('expected a CliError to be thrown')
		} catch (error) {
			expect(error).toBeInstanceOf(CliError)
			if (error instanceof CliError) {
				expect(error.code).toBe('PROJECT_NOT_ALLOWED')
				expect(error.exitCode).toBe(ExitCode.InputError)
			}
		}
	})

	test('createAuthPolicy treats ok without an id as a broken response', async () => {
		const { clients } = createClients({ createAuthPolicy: { ok: true } })

		try {
			await clients.policy.createAuthPolicy({ scope: 'global', roles: [] })
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('TENANT_API_INVALID_RESPONSE')
				expect(e.exitCode).toBe(ExitCode.InternalError)
			}
		}
	})

	test('deleteAuthPolicy maps NOT_FOUND onto the not-found exit code', async () => {
		const { clients } = createClients({ deleteAuthPolicy: { ok: false, error: { code: 'NOT_FOUND', developerMessage: 'gone' } } })

		try {
			await clients.policy.deleteAuthPolicy('pol-1')
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.exitCode).toBe(ExitCode.NotFound)
				expect(e.message).toContain('deleteAuthPolicy(pol-1)')
			}
		}
	})

	test('removeMailTemplate sends the identifier triple', async () => {
		const { clients, requests } = createClients({ removeMailTemplate: { ok: true } })

		await clients.policy.removeMailTemplate({ projectSlug: 'blog', type: 'EMAIL_OTP', variant: 'cs' })

		expect(requests[0].variables).toEqual({ templateIdentifier: { projectSlug: 'blog', type: 'EMAIL_OTP', variant: 'cs' } })
	})

	test('readAuthLog forwards the paging arguments and keeps hasMore', async () => {
		const { clients, requests } = createClients({ authLog: { hasMore: true, entries: [authLogRow] } })

		const page = await clients.policy.readAuthLog({ filter: { types: ['sign_in'] }, limit: 1, offset: 4 })

		expect(page.hasMore).toBe(true)
		expect(page.entries[0]).toEqual({
			id: 'log-1',
			createdAt: '2026-08-10T12:34:56.000Z',
			type: 'sign_in',
			success: false,
			invokedByIdentityId: null,
			personId: null,
			targetPersonId: null,
			personInputIdentifier: 'a@b.cz',
			errorCode: 'INVALID_CREDENTIALS',
			errorMessage: null,
			ipAddress: '10.0.0.1',
			userAgent: null,
			identityProviderId: null,
			metadata: null,
			eventData: null,
		})
		expect(requests[0].variables).toEqual({ filter: { types: ['sign_in'] }, limit: 1, offset: 4 })
	})
})

/**
 * The commands build their own transport through `TenantClientProvider`, so the network is stubbed at
 * the global `fetch` — a real socket is not an option, the bun test preload registers happy-dom and its
 * `fetch` cannot talk to `Bun.serve`.
 */
let responses: Record<string, unknown> = {}
let sentRequests: CapturedRequest[] = []
const originalFetch = globalThis.fetch

beforeAll(() => {
	globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const { query, variables }: { query: string; variables: Record<string, unknown> } = JSON.parse(String(init?.body))
		sentRequests.push({ query, variables })
		const operation = Object.keys(responses).find(it => query.includes(it))
		return new Response(JSON.stringify({ data: operation ? { [operation]: responses[operation] } : {} }), { status: 200 })
	}
})

afterAll(() => {
	globalThis.fetch = originalFetch
})

beforeEach(() => {
	responses = {}
	sentRequests = []
})

const createProvider = (): TenantClientProvider => {
	const remoteProjectProvider = new RemoteProjectProvider()
	remoteProjectProvider.setRemoteProject(new RemoteProject('blog', API_URL, 'token'))
	return new TenantClientProvider(remoteProjectProvider)
}

const stdinOf = (value: string): StdinReader => async () => value
/** Any read is a bug: a run that never passes a `--*-stdin` flag must not touch stdin at all. */
const noStdin: StdinReader = async () => {
	throw new Error('stdin must not be read without an explicit --*-stdin flag')
}

const expectCliError = async (run: Promise<unknown>, code: string, exitCode: ExitCode): Promise<void> => {
	try {
		await run
		throw new Error(`expected a CliError with code ${code}`)
	} catch (e) {
		expect(e).toBeInstanceOf(CliError)
		if (e instanceof CliError) {
			expect(e.code).toBe(code)
			expect(e.exitCode).toBe(exitCode)
		}
	}
}

describe('tenant policy list', () => {
	test('--json prints a bare array of policies on stdout', async () => {
		responses = { authPolicies: [policyRow] }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPolicyListCommand(createProvider()).run(['--json'], output)

		expect(JSON.parse(stdout.text)).toEqual([{
			id: 'pol-1',
			scope: 'project',
			project: 'blog',
			roles: ['editor', 'admin'],
			mfaRequired: true,
			tokenExpiration: 'PT1H',
			idleTimeout: null,
			mfaGraceDuration: null,
			rememberMeAllowed: null,
		}])
		expect(stderr.text).toBe('')
	})

	test('an empty list keeps stdout empty and explains itself on stderr', async () => {
		responses = { authPolicies: [] }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPolicyListCommand(createProvider()).run([], output)

		expect(stdout.text).toBe('')
		expect(stderr.text).toContain('No auth policies are configured.')
	})

	test('human role cells remove terminal controls while JSON keeps the raw role', async () => {
		const unsafeRole = `admin\u001b]8;;https://attacker.test\u0007\r\u0085tail`
		responses = { authPolicies: [{ ...policyRow, roles: [unsafeRole] }] }
		const human = createTestOutput()

		await new TenantPolicyListCommand(createProvider()).run([], human.output)

		for (const control of ['\u001b', '\u0007', '\r', '\u0085']) {
			expect(human.stdout.text).not.toContain(control)
		}
		const jsonOutput = createTestOutput()
		await new TenantPolicyListCommand(createProvider()).run(['--json'], jsonOutput.output)
		expect(JSON.parse(jsonOutput.stdout.text)[0].roles).toEqual([unsafeRole])
	})
})

describe('tenant policy create', () => {
	test('--json prints a structured result without diagnostics', async () => {
		responses = { createAuthPolicy: { ok: true, result: { id: 'pol-9' } } }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPolicyCreateCommand(createProvider(), noStdin).run(
			['--json', '--policy', '{"scope":"global","roles":["admin"],"mfaRequired":true}'],
			output,
		)

		expect(JSON.parse(stdout.text)).toEqual({ id: 'pol-9', scope: 'global', project: null })
		expect(sentRequests[0].variables).toEqual({ policy: { scope: 'global', roles: ['admin'], mfaRequired: true } })
		expect(stderr.text).toBe('')
	})

	test('--policy-stdin reads the JSON from stdin', async () => {
		responses = { createAuthPolicy: { ok: true, result: { id: 'pol-9' } } }
		const { output } = createTestOutput()

		await new TenantPolicyCreateCommand(createProvider(), stdinOf('{"scope":"global","roles":[]}')).run(['--json', '--policy-stdin'], output)

		expect(sentRequests[0].variables).toEqual({ policy: { scope: 'global', roles: [] } })
	})

	test('a global policy preserves an explicit project null', async () => {
		responses = { createAuthPolicy: { ok: true, result: { id: 'pol-9' } } }
		const { output, stdout } = createTestOutput()

		await new TenantPolicyCreateCommand(createProvider(), noStdin).run(
			['--json', '--policy', '{"scope":"global","project":null,"roles":[]}'],
			output,
		)

		expect(sentRequests[0].variables).toEqual({ policy: { scope: 'global', project: null, roles: [] } })
		expect(JSON.parse(stdout.text)).toEqual({ id: 'pol-9', scope: 'global', project: null })
	})

	test('with no source flag it fails instead of silently blocking on stdin', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantPolicyCreateCommand(createProvider(), noStdin).run(['--json'], output),
			'MISSING_INPUT_SOURCE',
			ExitCode.InputError,
		)
	})

	test('--policy and --policy-stdin together are ambiguous', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantPolicyCreateCommand(createProvider(), noStdin).run(['--policy', '{}', '--policy-stdin'], output),
			'AMBIGUOUS_INPUT_SOURCE',
			ExitCode.InputError,
		)
	})

	test('a misspelled policy field is rejected before the request', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantPolicyCreateCommand(createProvider(), noStdin).run(['--policy', '{"scope":"global","roles":[],"mfarequired":true}'], output),
			'INVALID_POLICY',
			ExitCode.InputError,
		)
		expect(sentRequests).toEqual([])
	})

	test('a project-scoped policy without a project is rejected before the request', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantPolicyCreateCommand(createProvider(), noStdin).run(['--policy', '{"scope":"project","roles":[]}'], output),
			'INVALID_POLICY',
			ExitCode.InputError,
		)
		expect(sentRequests).toEqual([])
	})

	test('malformed JSON is an input error, not a crash', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantPolicyCreateCommand(createProvider(), noStdin).run(['--policy', '{'], output),
			'INVALID_JSON',
			ExitCode.InputError,
		)
	})

	test('malformed JSON errors do not echo submitted content', async () => {
		const { output } = createTestOutput()
		const submitted = '{"secret":"SUPER_SECRET",'

		try {
			await new TenantPolicyCreateCommand(createProvider(), noStdin).run(['--policy', submitted], output)
			throw new Error('expected malformed JSON to fail')
		} catch (error) {
			expect(error).toBeInstanceOf(CliError)
			if (error instanceof CliError) {
				expect(error.message).not.toContain('SUPER_SECRET')
				expect(JSON.stringify(error.details) ?? '').not.toContain('SUPER_SECRET')
			}
		}
		expect(sentRequests).toEqual([])
	})

	test('--quiet emits only the created policy id', async () => {
		responses = { createAuthPolicy: { ok: true, result: { id: 'pol-9' } } }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPolicyCreateCommand(createProvider(), noStdin).run(
			['--quiet', '--policy', '{"scope":"global","roles":[]}'],
			output,
		)

		expect(stdout.lines).toEqual(['pol-9'])
		expect(stderr.text).toBe('')
	})
})

describe('tenant policy update', () => {
	test('sends the id together with the replacement policy', async () => {
		responses = { updateAuthPolicy: { ok: true } }
		const { output, stdout } = createTestOutput()

		await new TenantPolicyUpdateCommand(createProvider(), noStdin).run(
			['pol-1', '--json', '--policy', '{"scope":"global","project":null,"roles":["admin"],"idleTimeout":null}'],
			output,
		)

		expect(sentRequests[0].variables).toEqual({ id: 'pol-1', policy: { scope: 'global', project: null, roles: ['admin'], idleTimeout: null } })
		expect(JSON.parse(stdout.text)).toEqual({ id: 'pol-1', scope: 'global', project: null })
	})
})

describe('tenant policy delete', () => {
	test('refuses to run non-interactively without --yes', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantPolicyDeleteCommand(createProvider()).run(['pol-1'], output),
			'TTY_UNAVAILABLE',
			ExitCode.InputError,
		)
		expect(sentRequests).toEqual([])
	})

	test('--yes deletes and prints the id as data', async () => {
		responses = { deleteAuthPolicy: { ok: true } }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPolicyDeleteCommand(createProvider()).run(['pol-1', '--yes', '--json'], output)

		expect(sentRequests[0].variables).toEqual({ id: 'pol-1' })
		expect(JSON.parse(stdout.text)).toEqual({ id: 'pol-1' })
		expect(stderr.text).toBe('')
	})
})

describe('tenant mail-template list', () => {
	test('--json keeps the full content, the human table truncates it', async () => {
		responses = { mailTemplates: [mailTemplateRow] }
		const { output, stdout } = createTestOutput()

		await new TenantMailTemplateListCommand(createProvider()).run(['--json'], output)

		expect(JSON.parse(stdout.text)).toEqual([{
			projectSlug: null,
			type: 'RESET_PASSWORD_REQUEST',
			variant: null,
			subject: 'Reset',
			content: 'Hello {{name}}, follow the link.',
			useLayout: true,
			replyTo: null,
		}])
	})

	test('human content previews remove terminal controls while JSON keeps the raw body', async () => {
		const unsafeContent = `Hello\u001b]52;c;payload\u0007\r\u0085world`
		responses = { mailTemplates: [{ ...mailTemplateRow, content: unsafeContent }] }
		const human = createTestOutput()

		await new TenantMailTemplateListCommand(createProvider()).run([], human.output)

		for (const control of ['\u001b', '\u0007', '\r', '\u0085']) {
			expect(human.stdout.text).not.toContain(control)
		}
		const jsonOutput = createTestOutput()
		await new TenantMailTemplateListCommand(createProvider()).run(['--json'], jsonOutput.output)
		expect(JSON.parse(jsonOutput.stdout.text)[0].content).toBe(unsafeContent)
	})

	test('--quiet prints only the mail types', async () => {
		responses = { mailTemplates: [mailTemplateRow] }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantMailTemplateListCommand(createProvider()).run(['--quiet'], output)

		expect(stdout.lines).toEqual(['RESET_PASSWORD_REQUEST'])
		expect(stderr.text).toBe('')
	})
})

describe('tenant mail-template add', () => {
	test('--project scopes the template and --no-layout is the only explicit layout value sent', async () => {
		responses = { addMailTemplate: { ok: true } }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantMailTemplateAddCommand(createProvider(), noStdin).run(
			['email_otp', '--json', '--subject', 'Code', '--content', 'Your code is {{code}}', '--project', 'blog', '--variant', 'cs', '--no-layout'],
			output,
		)

		expect(sentRequests[0].variables).toEqual({
			template: {
				type: 'EMAIL_OTP',
				subject: 'Code',
				content: 'Your code is {{code}}',
				variant: 'cs',
				projectSlug: 'blog',
				useLayout: false,
			},
		})
		expect(JSON.parse(stdout.text)).toEqual({ projectSlug: 'blog', type: 'EMAIL_OTP', variant: 'cs' })
		expect(stderr.text).toBe('')
	})

	test('useLayout is left to the server when --no-layout is not passed', async () => {
		responses = { addMailTemplate: { ok: true } }
		const { output } = createTestOutput()

		await new TenantMailTemplateAddCommand(createProvider(), noStdin).run(['EMAIL_OTP', '--subject', 'Code', '--content', 'x'], output)

		expect(sentRequests[0].variables).toEqual({ template: { type: 'EMAIL_OTP', subject: 'Code', content: 'x' } })
	})

	test('--content-stdin reads the body from stdin', async () => {
		responses = { addMailTemplate: { ok: true } }
		const { output } = createTestOutput()

		await new TenantMailTemplateAddCommand(createProvider(), stdinOf('piped body')).run(
			['EMAIL_OTP', '--subject', 'Code', '--content-stdin'],
			output,
		)

		expect(sentRequests[0].variables).toEqual({ template: { type: 'EMAIL_OTP', subject: 'Code', content: 'piped body' } })
	})

	test('an explicitly empty body is preserved', async () => {
		responses = { addMailTemplate: { ok: true } }
		const { output } = createTestOutput()

		await new TenantMailTemplateAddCommand(createProvider(), stdinOf('')).run(
			['EMAIL_OTP', '--subject', 'Code', '--content-stdin'],
			output,
		)

		expect(sentRequests[0].variables).toEqual({ template: { type: 'EMAIL_OTP', subject: 'Code', content: '' } })
	})

	test('--quiet emits a stable template reference without the body', async () => {
		responses = { addMailTemplate: { ok: true } }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantMailTemplateAddCommand(createProvider(), noStdin).run(
			['EMAIL_OTP', '--quiet', '--subject', 'Code', '--content', 'SECRET_BODY'],
			output,
		)

		expect(stdout.lines).toEqual(['global:EMAIL_OTP:default'])
		expect(stdout.text).not.toContain('SECRET_BODY')
		expect(stderr.text).toBe('')
	})

	test('with no body source it fails instead of silently blocking on stdin', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMailTemplateAddCommand(createProvider(), noStdin).run(['EMAIL_OTP', '--subject', 'Code'], output),
			'MISSING_INPUT_SOURCE',
			ExitCode.InputError,
		)
		expect(sentRequests).toEqual([])
	})

	test('an unknown mail type is rejected before the request', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMailTemplateAddCommand(createProvider(), noStdin).run(['NOPE', '--subject', 's', '--content', 'c'], output),
			'UNKNOWN_MAIL_TYPE',
			ExitCode.InputError,
		)
		expect(sentRequests).toEqual([])
	})

	test('--content and --content-stdin together are ambiguous', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMailTemplateAddCommand(createProvider(), noStdin).run(
				['EMAIL_OTP', '--subject', 's', '--content', 'c', '--content-stdin'],
				output,
			),
			'AMBIGUOUS_INPUT_SOURCE',
			ExitCode.InputError,
		)
	})
})

describe('tenant mail-template remove', () => {
	test('refuses to run non-interactively without --yes', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMailTemplateRemoveCommand(createProvider()).run(['EMAIL_OTP'], output),
			'TTY_UNAVAILABLE',
			ExitCode.InputError,
		)
		expect(sentRequests).toEqual([])
	})

	test('--yes removes the global template and prints the identifier triple', async () => {
		responses = { removeMailTemplate: { ok: true } }
		const { output, stdout } = createTestOutput()

		await new TenantMailTemplateRemoveCommand(createProvider()).run(['EMAIL_OTP', '--yes', '--json'], output)

		expect(sentRequests[0].variables).toEqual({ templateIdentifier: { type: 'EMAIL_OTP' } })
		expect(JSON.parse(stdout.text)).toEqual({ projectSlug: null, type: 'EMAIL_OTP', variant: null })
	})
})

describe('tenant auth-log', () => {
	test('--json surfaces the entries together with the paging info', async () => {
		responses = { authLog: { hasMore: true, entries: [authLogRow] } }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantAuthLogCommand(createProvider()).run(['--json', '--limit', '1', '--offset', '4'], output)

		const payload = JSON.parse(stdout.text)
		expect(payload.hasMore).toBe(true)
		expect(payload.offset).toBe(4)
		expect(payload.nextOffset).toBe(5)
		expect(payload.entries).toHaveLength(1)
		expect(payload.entries[0].errorCode).toBe('INVALID_CREDENTIALS')
		expect(stderr.text).toBe('')
	})

	test('nextOffset is null on the last page', async () => {
		responses = { authLog: { hasMore: false, entries: [authLogRow] } }
		const { output, stdout } = createTestOutput()

		await new TenantAuthLogCommand(createProvider()).run(['--json'], output)

		expect(JSON.parse(stdout.text).nextOffset).toBeNull()
	})

	test('the filter flags map onto the AuthLogFilter input', async () => {
		responses = { authLog: { hasMore: false, entries: [] } }
		const { output } = createTestOutput()

		await new TenantAuthLogCommand(createProvider()).run(
			['--type', 'sign_in', '--type', 'sign_out', '--failed', '--person', 'p1', '--created-after', '2026-01-01T00:00:00Z'],
			output,
		)

		expect(sentRequests[0].variables).toEqual({
			filter: { types: ['sign_in', 'sign_out'], success: false, personId: 'p1', createdAfter: '2026-01-01T00:00:00Z' },
			offset: 0,
		})
	})

	test('no filter flag means no filter argument at all', async () => {
		responses = { authLog: { hasMore: false, entries: [] } }
		const { output } = createTestOutput()

		await new TenantAuthLogCommand(createProvider()).run([], output)

		expect(sentRequests[0].variables).toEqual({ offset: 0 })
	})

	test('--success and --failed together are rejected', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantAuthLogCommand(createProvider()).run(['--success', '--failed'], output),
			'AMBIGUOUS_INPUT',
			ExitCode.InputError,
		)
	})

	test('a non-numeric --limit is rejected before the request', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantAuthLogCommand(createProvider()).run(['--limit', 'lots'], output),
			'INVALID_PAGINATION_LIMIT',
			ExitCode.InputError,
		)
		expect(sentRequests).toEqual([])
	})

	test('--limit 0 is rejected before the request', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantAuthLogCommand(createProvider()).run(['--limit', '0'], output),
			'INVALID_PAGINATION_LIMIT',
			ExitCode.InputError,
		)
		expect(sentRequests).toEqual([])
	})

	test('an empty page cannot expose a non-advancing nextOffset', async () => {
		responses = { authLog: { hasMore: true, entries: [] } }
		const { output, stdout } = createTestOutput()

		await new TenantAuthLogCommand(createProvider()).run(['--json', '--offset', '5'], output)

		expect(JSON.parse(stdout.text)).toMatchObject({ hasMore: false, offset: 5, nextOffset: null })
	})

	test('pagination terminates when advancing would exceed the GraphQL Int range', async () => {
		responses = { authLog: { hasMore: true, entries: [authLogRow] } }
		const { output, stdout } = createTestOutput()

		await new TenantAuthLogCommand(createProvider()).run(['--json', '--offset', '2147483647'], output)

		expect(JSON.parse(stdout.text)).toMatchObject({ hasMore: false, offset: 2147483647, nextOffset: null })
	})

	test('the human table formats the timestamp and stdout stays free of diagnostics', async () => {
		responses = { authLog: { hasMore: false, entries: [authLogRow] } }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantAuthLogCommand(createProvider()).run([], output)

		expect(stdout.text).toContain('2026-08-10 12:34:56')
		expect(stdout.text).not.toContain('2026-08-10T12:34:56.000Z')
		expect(stdout.text).not.toContain('authLog:')
		expect(stderr.text).toContain('authLog: 1 entries from offset 0')
	})

	test('human auth-log rows remove terminal controls while JSON keeps remote fields unchanged', async () => {
		const unsafeValue = `remote\u001b]8;;https://attacker.test\u0007\r\u0085tail`
		responses = {
			authLog: {
				hasMore: false,
				entries: [{ ...authLogRow, type: unsafeValue, personInputIdentifier: unsafeValue, errorCode: unsafeValue, ipAddress: unsafeValue }],
			},
		}
		const human = createTestOutput()

		await new TenantAuthLogCommand(createProvider()).run([], human.output)

		for (const control of ['\u001b', '\u0007', '\r', '\u0085']) {
			expect(human.stdout.text).not.toContain(control)
		}
		const jsonOutput = createTestOutput()
		await new TenantAuthLogCommand(createProvider()).run(['--json'], jsonOutput.output)
		const entry = JSON.parse(jsonOutput.stdout.text).entries[0]
		expect(entry.type).toBe(unsafeValue)
		expect(entry.personInputIdentifier).toBe(unsafeValue)
		expect(entry.errorCode).toBe(unsafeValue)
		expect(entry.ipAddress).toBe(unsafeValue)
	})
})
