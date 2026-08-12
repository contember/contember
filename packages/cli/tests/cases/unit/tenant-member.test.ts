import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { CliError, ExitCode } from '@contember/cli-common'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import { TenantMemberAddCommand } from '../../../src/commands/tenant/member/TenantMemberAddCommand.js'
import { TenantMemberInviteCommand } from '../../../src/commands/tenant/member/TenantMemberInviteCommand.js'
import { TenantMemberInviteUnmanagedCommand } from '../../../src/commands/tenant/member/TenantMemberInviteUnmanagedCommand.js'
import { TenantMemberListCommand } from '../../../src/commands/tenant/member/TenantMemberListCommand.js'
import { TenantMemberRemoveCommand } from '../../../src/commands/tenant/member/TenantMemberRemoveCommand.js'
import { TenantMemberUpdateCommand } from '../../../src/commands/tenant/member/TenantMemberUpdateCommand.js'
import { RemoteProject } from '../../../src/lib/project/RemoteProject.js'
import { RemoteProjectProvider } from '../../../src/lib/project/RemoteProjectProvider.js'
import { TenantClientProvider } from '../../../src/lib/TenantClientProvider.js'

interface CapturedRequest {
	query: string
	variables: Record<string, unknown>
}

const API_URL = 'http://tenant.test'

const requests: CapturedRequest[] = []
let responseData: unknown = {}

/**
 * The commands build their own transport, so the network is stubbed at the global `fetch` — a real socket
 * is not an option, the bun test preload registers happy-dom and its `fetch` cannot talk to `Bun.serve`.
 */
const originalFetch = globalThis.fetch

beforeAll(() => {
	globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const { query, variables }: CapturedRequest = JSON.parse(String(init?.body))
		requests.push({ query, variables })
		return new Response(JSON.stringify({ data: responseData }), { status: 200 })
	}
})

afterAll(() => {
	globalThis.fetch = originalFetch
})

beforeEach(() => {
	requests.length = 0
	responseData = {}
})

const clientProvider = (): TenantClientProvider => {
	const remoteProjectProvider = new RemoteProjectProvider()
	remoteProjectProvider.setRemoteProject(new RemoteProject('blog', API_URL, 'token'))
	return new TenantClientProvider(remoteProjectProvider)
}

const member = (identityId: string, email: string | null, role: string) => ({
	identity: { id: identityId, description: null, person: email === null ? null : { id: `p-${identityId}`, email, name: 'Jane' } },
	memberships: [{ role, variables: [{ name: 'locale', values: ['cs', 'en'] }] }],
})

const invitePayload = (isNew: boolean) => ({
	ok: true,
	result: { isNew, person: { id: 'p1', email: 'jane@example.com', name: 'Jane', identity: { id: 'i1' } } },
})

const expectCliError = async (run: Promise<unknown>, code: string, exitCode: ExitCode): Promise<CliError> => {
	try {
		await run
		throw new Error(`expected a CliError with code ${code}`)
	} catch (e) {
		expect(e).toBeInstanceOf(CliError)
		if (!(e instanceof CliError)) {
			throw e
		}
		expect(e.code).toBe(code)
		expect(e.exitCode).toBe(exitCode)
		return e
	}
}

describe('tenant member list', () => {
	test('--json prints a bare array of members on stdout', async () => {
		responseData = { projectBySlug: { members: [member('i1', 'jane@example.com', 'editor')] } }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantMemberListCommand(clientProvider()).run(['--project', 'blog', '--json'], output)

		expect(JSON.parse(stdout.text)).toEqual([{
			identityId: 'i1',
			personId: 'p-i1',
			email: 'jane@example.com',
			name: 'Jane',
			description: null,
			memberships: [{ role: 'editor', variables: [{ name: 'locale', values: ['cs', 'en'] }] }],
		}])
		expect(stderr.text).toBe('')
	})

	test('human mode renders a table and keeps stdout free of diagnostics', async () => {
		responseData = { projectBySlug: { members: [member('i1', 'jane@example.com', 'editor')] } }
		const { output, stdout } = createTestOutput()

		await new TenantMemberListCommand(clientProvider()).run(['--project', 'blog'], output)

		expect(stdout.text).toContain('i1')
		expect(stdout.text).toContain('editor (locale: cs, en)')
	})

	test('human membership cells remove terminal controls while JSON keeps the raw fields', async () => {
		const unsafeRole = `editor\u001b]8;;https://attacker.test\u0007\r\u0085tail`
		responseData = { projectBySlug: { members: [member('i1', 'jane@example.com', unsafeRole)] } }
		const human = createTestOutput()

		await new TenantMemberListCommand(clientProvider()).run(['--project', 'blog'], human.output)

		for (const control of ['\u001b', '\u0007', '\r', '\u0085']) {
			expect(human.stdout.text).not.toContain(control)
		}
		const jsonOutput = createTestOutput()
		await new TenantMemberListCommand(clientProvider()).run(['--project', 'blog', '--json'], jsonOutput.output)
		expect(JSON.parse(jsonOutput.stdout.text)[0].memberships[0].role).toBe(unsafeRole)
	})

	test('--quiet prints only the identity ids', async () => {
		responseData = { projectBySlug: { members: [member('i1', 'jane@example.com', 'editor'), member('i2', null, 'admin')] } }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantMemberListCommand(clientProvider()).run(['--project', 'blog', '--quiet'], output)

		expect(stdout.lines).toEqual(['i1', 'i2'])
		expect(stderr.text).toBe('')
	})

	test('the filters are sent as a ProjectMembersInput', async () => {
		responseData = { projectBySlug: { members: [] } }
		const { output } = createTestOutput()

		await new TenantMemberListCommand(clientProvider()).run(
			['--project', 'blog', '--identity', 'i1', '--identity', 'i2', '--email', 'jane@example.com', '--type', 'person', '--limit', '10'],
			output,
		)

		expect(requests[0].variables).toEqual({
			slug: 'blog',
			input: {
				filter: { identityId: ['i1', 'i2'], email: ['jane@example.com'], personId: undefined, memberType: 'PERSON' },
				limit: 10,
				offset: undefined,
			},
		})
	})

	test('an unknown --type is an input error and nothing is sent', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMemberListCommand(clientProvider()).run(['--project', 'blog', '--type', 'robot'], output),
			'INVALID_INPUT',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
	})

	test('an empty result warns that it may be a permission problem, on stderr only', async () => {
		responseData = { projectBySlug: { members: [] } }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantMemberListCommand(clientProvider()).run(['--project', 'blog'], output)

		expect(stdout.text).toBe('')
		expect(stderr.text).toContain('project.view members')
	})

	test('a missing project is a not-found error', async () => {
		responseData = { projectBySlug: null }
		const { output } = createTestOutput()

		await expectCliError(new TenantMemberListCommand(clientProvider()).run(['--project', 'nope'], output), 'PROJECT_NOT_FOUND', ExitCode.NotFound)
	})
})

describe('membership input', () => {
	test('a repeated --role becomes a membership without variables', async () => {
		responseData = { addProjectMember: { ok: true } }
		const { output, stdout } = createTestOutput()

		await new TenantMemberAddCommand(clientProvider()).run(
			['--project', 'blog', '--identity', 'i1', '--role', 'editor', '--role', 'admin', '--json'],
			output,
		)

		expect(requests[0].variables.memberships).toEqual([
			{ role: 'editor', variables: [] },
			{ role: 'admin', variables: [] },
		])
		expect(JSON.parse(stdout.text)).toEqual({
			projectSlug: 'blog',
			identityId: 'i1',
			memberships: [{ role: 'editor', variables: [] }, { role: 'admin', variables: [] }],
		})
	})

	test('--memberships carries the full structure including variables', async () => {
		responseData = { addProjectMember: { ok: true } }
		const { output } = createTestOutput()

		await new TenantMemberAddCommand(clientProvider()).run([
			'--project',
			'blog',
			'--identity',
			'i1',
			'--memberships',
			'[{"role":"editor","variables":[{"name":"locale","values":["cs","en"]}]}]',
		], output)

		expect(requests[0].variables.memberships).toEqual([{ role: 'editor', variables: [{ name: 'locale', values: ['cs', 'en'] }] }])
	})

	test('a value containing a comma survives, which a compact string syntax could not express', async () => {
		responseData = { addProjectMember: { ok: true } }
		const { output } = createTestOutput()

		await new TenantMemberAddCommand(clientProvider()).run([
			'--project',
			'blog',
			'--identity',
			'i1',
			'--memberships',
			'[{"role":"editor","variables":[{"name":"tag","values":["a,b","c=d"]}]}]',
		], output)

		expect(requests[0].variables.memberships).toEqual([{ role: 'editor', variables: [{ name: 'tag', values: ['a,b', 'c=d'] }] }])
	})

	test('--memberships-stdin reads the same structure from stdin', async () => {
		responseData = { addProjectMember: { ok: true } }
		const { output } = createTestOutput()
		const stdin = async () => '[{"role":"editor"}]\n'

		await new TenantMemberAddCommand(clientProvider(), stdin).run(['--project', 'blog', '--identity', 'i1', '--memberships-stdin'], output)

		expect(requests[0].variables.memberships).toEqual([{ role: 'editor', variables: [] }])
	})

	test('mixing --role with --memberships is refused', async () => {
		const { output } = createTestOutput()

		const error = await expectCliError(
			new TenantMemberAddCommand(clientProvider()).run(['--project', 'blog', '--identity', 'i1', '--role', 'editor', '--memberships', '[]'], output),
			'INVALID_MEMBERSHIPS',
			ExitCode.InputError,
		)
		expect(error.message).toContain('not both')
		expect(requests).toHaveLength(0)
	})

	test('mixing --memberships with --memberships-stdin is refused', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMemberAddCommand(clientProvider()).run(['--project', 'blog', '--identity', 'i1', '--memberships', '[]', '--memberships-stdin'], output),
			'INVALID_MEMBERSHIPS',
			ExitCode.InputError,
		)
	})

	test('no membership option at all is refused', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMemberAddCommand(clientProvider()).run(['--project', 'blog', '--identity', 'i1'], output),
			'INVALID_MEMBERSHIPS',
			ExitCode.InputError,
		)
	})

	test('a misspelled key is reported instead of being silently dropped', async () => {
		const { output } = createTestOutput()

		const error = await expectCliError(
			new TenantMemberAddCommand(clientProvider()).run(
				['--project', 'blog', '--identity', 'i1', '--memberships', '[{"role":"editor","vars":[]}]'],
				output,
			),
			'INVALID_MEMBERSHIPS',
			ExitCode.InputError,
		)
		expect(error.message).toContain('vars')
	})

	test('malformed JSON is an input error naming the origin', async () => {
		const { output } = createTestOutput()

		const error = await expectCliError(
			new TenantMemberAddCommand(clientProvider()).run(['--project', 'blog', '--identity', 'i1', '--memberships', '{'], output),
			'INVALID_MEMBERSHIPS',
			ExitCode.InputError,
		)
		expect(error.message).toContain('--memberships')
	})

	test('an explicit empty array still requires confirmation before clearing memberships', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMemberUpdateCommand(clientProvider()).run(['--project', 'blog', '--identity', 'i1', '--memberships', '[]'], output),
			'TTY_UNAVAILABLE',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
	})

	test('--yes explicitly accepts clearing every membership', async () => {
		responseData = { updateProjectMember: { ok: true } }
		const { output } = createTestOutput()

		await new TenantMemberUpdateCommand(clientProvider()).run(['--project', 'blog', '--identity', 'i1', '--memberships', '[]', '--yes'], output)

		expect(requests[0].variables.memberships).toEqual([])
		expect(requests[0].query).toContain('updateProjectMember')
	})

	test('a non-empty membership update does not require --yes', async () => {
		responseData = { updateProjectMember: { ok: true } }
		const { output } = createTestOutput()

		await new TenantMemberUpdateCommand(clientProvider()).run(
			['--project', 'blog', '--identity', 'i1', '--role', 'editor'],
			output,
		)

		expect(requests[0].variables.memberships).toEqual([{ role: 'editor', variables: [] }])
	})
})

describe('tenant member remove', () => {
	test('refuses to run without --yes when there is no TTY, and sends nothing', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMemberRemoveCommand(clientProvider()).run(['--project', 'blog', '--identity', 'i1'], output),
			'TTY_UNAVAILABLE',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
	})

	test('--yes removes the member and reports it as data', async () => {
		responseData = { removeProjectMember: { ok: true } }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantMemberRemoveCommand(clientProvider()).run(['--project', 'blog', '--identity', 'i1', '--yes', '--json'], output)

		expect(requests[0].variables).toEqual({ projectSlug: 'blog', identityId: 'i1' })
		expect(JSON.parse(stdout.text)).toEqual({ projectSlug: 'blog', identityId: 'i1', removed: true })
		expect(stderr.text).toBe('')
	})

	test('a NOT_MEMBER payload becomes a not-found CliError', async () => {
		responseData = { removeProjectMember: { ok: false, error: { code: 'NOT_MEMBER', developerMessage: 'not a member' } } }
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMemberRemoveCommand(clientProvider()).run(['--project', 'blog', '--identity', 'i1', '--yes'], output),
			'NOT_MEMBER',
			ExitCode.NotFound,
		)
	})
})

describe('tenant member invite', () => {
	test('--json reports the created person, and --json does not imply --yes anywhere here', async () => {
		responseData = { invite: invitePayload(true) }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantMemberInviteCommand(clientProvider()).run(
			['--project', 'blog', '--email', 'jane@example.com', '--name', 'Jane', '--role', 'editor', '--json'],
			output,
		)

		expect(JSON.parse(stdout.text)).toEqual({
			projectSlug: 'blog',
			personId: 'p1',
			identityId: 'i1',
			email: 'jane@example.com',
			name: 'Jane',
			isNew: true,
		})
		expect(stderr.text).toBe('')
	})

	test('human invite result removes terminal controls while JSON keeps remote identity fields', async () => {
		const unsafeValue = `remote\u001b]52;c;payload\u0007\r\u0085tail`
		responseData = {
			invite: {
				ok: true,
				result: { isNew: true, person: { id: 'p1', email: unsafeValue, name: 'Jane', identity: { id: unsafeValue } } },
			},
		}
		const args = ['--project', 'blog', '--email', 'jane@example.com', '--role', 'editor']
		const human = createTestOutput()

		await new TenantMemberInviteCommand(clientProvider()).run(args, human.output)

		for (const control of ['\u001b', '\u0007', '\r', '\u0085']) {
			expect(human.stdout.text).not.toContain(control)
		}
		const jsonOutput = createTestOutput()
		await new TenantMemberInviteCommand(clientProvider()).run([...args, '--json'], jsonOutput.output)
		const result = JSON.parse(jsonOutput.stdout.text)
		expect(result.email).toBe(unsafeValue)
		expect(result.identityId).toBe(unsafeValue)
	})

	test('the mail options are sent as InviteOptions', async () => {
		responseData = { invite: invitePayload(false) }
		const { output } = createTestOutput()

		await new TenantMemberInviteCommand(clientProvider()).run(
			['--project', 'blog', '--email', 'jane@example.com', '--role', 'editor', '--method', 'reset_password', '--mail-variant', 'cs'],
			output,
		)

		expect(requests[0].variables.options).toEqual({ method: 'RESET_PASSWORD', mailVariant: 'cs' })
	})

	test('an unknown --method is an input error', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMemberInviteCommand(clientProvider()).run([
				'--project',
				'blog',
				'--email',
				'jane@example.com',
				'--role',
				'editor',
				'--method',
				'carrier-pigeon',
			], output),
			'INVALID_INPUT',
			ExitCode.InputError,
		)
	})
})

describe('tenant member invite-unmanaged', () => {
	test('--password-env keeps the secret out of argv and sends it in UnmanagedInviteOptions', async () => {
		responseData = { unmanagedInvite: invitePayload(true) }
		const { output } = createTestOutput()

		await new TenantMemberInviteUnmanagedCommand(clientProvider(), undefined, { INIT_PASSWORD: 's3cret' }).run(
			['--project', 'blog', '--email', 'jane@example.com', '--role', 'editor', '--password-env', 'INIT_PASSWORD'],
			output,
		)

		expect(requests[0].query).toContain('unmanagedInvite')
		expect(requests[0].variables.options).toEqual({ password: 's3cret', resetTokenHash: undefined })
	})

	test('an unset --password-env variable is an input error', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMemberInviteUnmanagedCommand(clientProvider(), undefined, {}).run(
				['--project', 'blog', '--email', 'jane@example.com', '--role', 'editor', '--password-env', 'MISSING'],
				output,
			),
			'INPUT_ENV_NOT_SET',
			ExitCode.InputError,
		)
	})

	test('--password together with --password-env is refused', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMemberInviteUnmanagedCommand(clientProvider(), undefined, { INIT_PASSWORD: 's3cret' }).run(
				['--project', 'blog', '--email', 'jane@example.com', '--role', 'editor', '--password', 'x', '--password-env', 'INIT_PASSWORD'],
				output,
			),
			'AMBIGUOUS_INPUT_SOURCE',
			ExitCode.InputError,
		)
	})

	test('refuses an unmanaged invite without exactly one credential', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMemberInviteUnmanagedCommand(clientProvider(), undefined, {}).run(
				['--project', 'blog', '--email', 'jane@example.com', '--role', 'editor'],
				output,
			),
			'MISSING_INPUT_SOURCE',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
	})

	test('refuses both credential semantics before sending a request', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMemberInviteUnmanagedCommand(clientProvider(), undefined, {}).run(
				[
					'--project',
					'blog',
					'--email',
					'jane@example.com',
					'--role',
					'editor',
					'--password',
					's3cret',
					'--reset-token-hash',
					'a'.repeat(64),
				],
				output,
			),
			'AMBIGUOUS_INPUT_SOURCE',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
	})

	test('a reset token hash from stdin loses exactly one trailing line ending', async () => {
		responseData = { unmanagedInvite: invitePayload(true) }
		const { output } = createTestOutput()
		const hash = 'a'.repeat(64)

		await new TenantMemberInviteUnmanagedCommand(clientProvider(), async () => `${hash}\r\n`, {}).run(
			['--project', 'blog', '--email', 'jane@example.com', '--role', 'editor', '--reset-token-hash-stdin'],
			output,
		)

		expect(requests[0].variables.options).toEqual({ resetTokenHash: hash })
	})

	test('a password from stdin loses one line ending and preserves other whitespace', async () => {
		responseData = { unmanagedInvite: invitePayload(true) }
		const { output } = createTestOutput()

		await new TenantMemberInviteUnmanagedCommand(clientProvider(), async () => ' initial password \n', {}).run(
			['--project', 'blog', '--email', 'jane@example.com', '--role', 'editor', '--password-stdin'],
			output,
		)

		expect(requests[0].variables.options).toEqual({ password: ' initial password ' })
	})

	test('rejects memberships and credential stdin consumers before the first read', async () => {
		let reads = 0
		const { output } = createTestOutput()

		await expectCliError(
			new TenantMemberInviteUnmanagedCommand(clientProvider(), async () => {
				reads++
				return 'value'
			}, {}).run(
				[
					'--project',
					'blog',
					'--email',
					'jane@example.com',
					'--memberships-stdin',
					'--password-stdin',
				],
				output,
			),
			'AMBIGUOUS_STDIN_INPUT',
			ExitCode.InputError,
		)
		expect(reads).toBe(0)
		expect(requests).toHaveLength(0)
	})

	test('rejects uppercase and malformed reset token hashes before network', async () => {
		for (const hash of ['A'.repeat(64), 'a'.repeat(63), `${'a'.repeat(63)}g`]) {
			const { output } = createTestOutput()
			await expectCliError(
				new TenantMemberInviteUnmanagedCommand(clientProvider(), undefined, {}).run(
					['--project', 'blog', '--email', 'jane@example.com', '--role', 'editor', '--reset-token-hash', hash],
					output,
				),
				'INVALID_RESET_TOKEN_HASH',
				ExitCode.InputError,
			)
		}
		expect(requests).toHaveLength(0)
	})

	test('--quiet prints only the invited identity id', async () => {
		responseData = { unmanagedInvite: invitePayload(true) }
		const { output, stdout, stderr } = createTestOutput()

		await new TenantMemberInviteUnmanagedCommand(clientProvider(), undefined, { INIT_PASSWORD: 's3cret' }).run(
			['--project', 'blog', '--email', 'jane@example.com', '--role', 'editor', '--password-env', 'INIT_PASSWORD', '--quiet'],
			output,
		)

		expect(stdout.lines).toEqual(['i1'])
		expect(stderr.text).toBe('')
	})

	test('an INVALID_MEMBERSHIP payload surfaces the tenant code and the developer message', async () => {
		responseData = {
			unmanagedInvite: { ok: false, error: { code: 'INVALID_MEMBERSHIP', developerMessage: 'Role nope is not defined in a schema.' } },
		}
		const { output } = createTestOutput()

		const error = await expectCliError(
			new TenantMemberInviteUnmanagedCommand(clientProvider(), undefined, {}).run(
				['--project', 'blog', '--email', 'jane@example.com', '--role', 'nope', '--password', 's3cret'],
				output,
			),
			'INVALID_MEMBERSHIP',
			ExitCode.InputError,
		)
		expect(error.message).toContain('Role nope is not defined in a schema.')
	})
})
