import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test'
import { CliError, ExitCode, renderCliError, toCliError } from '@contember/cli-common'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import {
	TenantIdentityRoleAddCommand,
	TenantIdentityRoleRemoveCommand,
	TenantPersonCreateCommand,
	TenantPersonDisableCommand,
	TenantPersonListCommand,
	TenantPersonResetMfaCommand,
	TenantPersonResetPasswordRequestCommand,
	TenantPersonSetPasswordCommand,
	TenantPersonShowCommand,
	TenantPersonSignOutCommand,
	TenantPersonUpdateCommand,
	TenantSessionCreateCommand,
} from '../../../src/commands/tenant/person/index.js'
import { RemoteProject } from '../../../src/lib/project/RemoteProject.js'
import { RemoteProjectProvider } from '../../../src/lib/project/RemoteProjectProvider.js'
import { TenantClientProvider } from '../../../src/lib/TenantClientProvider.js'

const API_URL = 'http://tenant.test'

interface CapturedRequest {
	query: string
	variables: Record<string, unknown>
}

/**
 * The commands build their own transport, so the network is stubbed at the global `fetch` — a real socket is
 * not an option here, the bun test preload registers happy-dom and its `fetch` cannot talk to `Bun.serve`.
 */
const requests: CapturedRequest[] = []
let respond: (request: CapturedRequest) => unknown = () => ({})
const originalFetch = globalThis.fetch

beforeAll(() => {
	globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const body: CapturedRequest = JSON.parse(String(init?.body))
		requests.push(body)
		return new Response(JSON.stringify({ data: respond(body) }), { status: 200 })
	}
})

afterAll(() => {
	globalThis.fetch = originalFetch
})

afterEach(() => {
	requests.length = 0
	respond = () => ({})
})

const answerWith = (data: unknown): void => {
	respond = () => data
}

const createProvider = (): TenantClientProvider => {
	const remoteProjectProvider = new RemoteProjectProvider()
	remoteProjectProvider.setRemoteProject(new RemoteProject('blog', API_URL, 'token'))
	return new TenantClientProvider(remoteProjectProvider)
}

const expectCliError = async (run: () => Promise<unknown>, code: string, exitCode: ExitCode): Promise<CliError> => {
	let thrown: unknown
	try {
		await run()
	} catch (e) {
		thrown = toCliError(e)
	}
	expect(thrown).toBeInstanceOf(CliError)
	if (thrown instanceof CliError) {
		expect(thrown.code).toBe(code)
		expect(thrown.exitCode).toBe(exitCode)
		return thrown
	}
	throw new Error('expected a CliError to be thrown')
}

const personRow = {
	id: 'p1',
	email: 'alice@example.com',
	name: 'Alice',
	otpEnabled: false,
	emailOtpEnabled: false,
	emailVerified: true,
	identity: { id: 'i1' },
}

const expectedPerson = {
	id: 'p1',
	identityId: 'i1',
	email: 'alice@example.com',
	name: 'Alice',
	otpEnabled: false,
	emailOtpEnabled: false,
	emailVerified: true,
}

describe('tenant person list', () => {
	test('documents substring semantics and forwards literal wildcard characters for server-side escaping', async () => {
		const command = new TenantPersonListCommand(createProvider())
		const emailOption = command.getConfiguration().getOptions().find(it => it.name === 'email')
		expect(emailOption?.description).toContain('case-insensitive substring')
		answerWith({ persons: [] })
		const { output } = createTestOutput()

		await command.run(['--email', '%alice_example%'], output)

		expect(requests[0].variables).toMatchObject({ filter: { email: '%alice_example%' } })
	})

	test('--json prints a bare array on stdout and nothing else', async () => {
		answerWith({ persons: [personRow] })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPersonListCommand(createProvider()).run(['--json'], output)

		expect(JSON.parse(stdout.text)).toEqual([expectedPerson])
		expect(stderr.text).toBe('')
		expect(requests[0].variables).toEqual({ filter: undefined, limit: undefined, offset: undefined })
	})

	test('the filter and the pagination flags become query variables', async () => {
		answerWith({ persons: [] })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPersonListCommand(createProvider()).run(
			['--email', 'alice@example.com', '--identity-id', 'i1', '--limit', '50', '--offset', '100'],
			output,
		)

		expect(requests[0].variables).toEqual({
			filter: { email: 'alice@example.com', personId: undefined, identityId: 'i1' },
			limit: 50,
			offset: 100,
		})
		expect(stdout.text).toBe('')
		expect(stderr.text).toContain('No persons matched.')
	})

	test('--quiet prints only the person ids', async () => {
		answerWith({ persons: [personRow, { ...personRow, id: 'p2', identity: { id: 'i2' } }] })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPersonListCommand(createProvider()).run(['--quiet'], output)

		expect(stdout.lines).toEqual(['p1', 'p2'])
		expect(stderr.text).toBe('')
	})

	test('invalid GraphQL pagination integers are rejected locally', async () => {
		const { output } = createTestOutput()

		for (
			const { flag, value, code } of [
				{ flag: '--limit', value: '0', code: 'INVALID_PAGINATION_LIMIT' },
				{ flag: '--limit', value: 'lots', code: 'INVALID_PAGINATION_LIMIT' },
				{ flag: '--limit', value: '2147483648', code: 'INVALID_PAGINATION_LIMIT' },
				{ flag: '--limit', value: '9007199254740992', code: 'INVALID_PAGINATION_LIMIT' },
				{ flag: '--offset', value: '2147483648', code: 'INVALID_PAGINATION_OFFSET' },
				{ flag: '--offset', value: '9007199254740992', code: 'INVALID_PAGINATION_OFFSET' },
			]
		) {
			await expectCliError(
				() => new TenantPersonListCommand(createProvider()).run([flag, value], output),
				code,
				ExitCode.InputError,
			)
		}
		expect(requests).toHaveLength(0)
	})
})

describe('tenant person show', () => {
	const personDetailRow = {
		...personRow,
		passwordlessEnabled: null,
		identity: {
			id: 'i1',
			roles: ['super_admin'],
			sessions: [{
				id: 's1',
				createdAt: '2026-01-01T00:00:00Z',
				expiresAt: null,
				lastUsedAt: '2026-01-02T00:00:00Z',
				lastIp: '10.0.0.1',
				lastUserAgent: null,
				createdIp: null,
				createdUserAgent: null,
				isCurrent: false,
				trustForwardedClientInfo: false,
			}],
		},
		identityProviders: [{
			id: 'pi1',
			createdAt: '2026-01-03T00:00:00Z',
			externalIdentifier: 'ext-1',
			identityProvider: { slug: 'google', type: 'oidc', disabledAt: null },
		}],
	}

	test('--json flattens the sessions and the identity providers', async () => {
		answerWith({ personById: personDetailRow })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPersonShowCommand(createProvider()).run(['p1', '--json'], output)

		expect(JSON.parse(stdout.text)).toEqual({
			...expectedPerson,
			passwordlessEnabled: null,
			roles: ['super_admin'],
			sessions: [{
				id: 's1',
				createdAt: '2026-01-01T00:00:00Z',
				expiresAt: null,
				lastUsedAt: '2026-01-02T00:00:00Z',
				lastIp: '10.0.0.1',
				lastUserAgent: null,
				createdIp: null,
				createdUserAgent: null,
				isCurrent: false,
				trustForwardedClientInfo: false,
			}],
			identityProviders: [{ id: 'pi1', slug: 'google', type: 'oidc', externalIdentifier: 'ext-1', createdAt: '2026-01-03T00:00:00Z' }],
		})
		expect(stderr.text).toBe('')
	})

	test('human mode includes session ids and forwarded-client trust', async () => {
		answerWith({ personById: personDetailRow })
		const { output, stdout } = createTestOutput()

		await new TenantPersonShowCommand(createProvider()).run(['p1'], output)

		expect(stdout.text).toContain('s1')
		expect(stdout.text).toContain('trust forwarded client info no')
		expect(stdout.text).toContain('google (oidc)')
	})

	test('human detail removes terminal controls while JSON keeps remote strings unchanged', async () => {
		const unsafeValue = `remote\u001b]52;c;payload\u0007\r\u0085tail`
		const unsafePerson = {
			...personDetailRow,
			name: unsafeValue,
			identity: {
				...personDetailRow.identity,
				roles: [unsafeValue],
				sessions: [{ ...personDetailRow.identity.sessions[0], id: unsafeValue }],
			},
			identityProviders: [{
				...personDetailRow.identityProviders[0],
				externalIdentifier: unsafeValue,
			}],
		}
		answerWith({ personById: unsafePerson })
		const human = createTestOutput()

		await new TenantPersonShowCommand(createProvider()).run(['p1'], human.output)

		for (const control of ['\u001b', '\u0007', '\r', '\u0085']) {
			expect(human.stdout.text).not.toContain(control)
		}
		const jsonOutput = createTestOutput()
		await new TenantPersonShowCommand(createProvider()).run(['p1', '--json'], jsonOutput.output)
		const raw = JSON.parse(jsonOutput.stdout.text)
		expect(raw.name).toBe(unsafeValue)
		expect(raw.roles).toEqual([unsafeValue])
		expect(raw.sessions[0].id).toBe(unsafeValue)
		expect(raw.identityProviders[0].externalIdentifier).toBe(unsafeValue)
	})

	test('an unknown or invisible person is a not-found error', async () => {
		answerWith({ personById: null })
		const { output } = createTestOutput()

		await expectCliError(() => new TenantPersonShowCommand(createProvider()).run(['nope'], output), 'PERSON_NOT_FOUND', ExitCode.NotFound)
	})
})

describe('tenant person create', () => {
	test('rejects an empty person name before the network', async () => {
		const { output } = createTestOutput()
		await expectCliError(
			() => new TenantPersonCreateCommand(createProvider()).run(['alice@example.com', '--name', '   '], output),
			'EMPTY_NAME',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
	})

	test('reads the password from stdin and keeps stdout free of diagnostics', async () => {
		answerWith({ signUp: { ok: true, result: { person: personRow } } })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPersonCreateCommand(createProvider(), async () => 'sekret\n').run(
			['alice@example.com', '--password-stdin', '--name', 'Alice', '--role', 'admin', '--role', 'editor', '--json'],
			output,
		)

		expect(requests[0].variables).toEqual({
			email: 'alice@example.com',
			password: 'sekret',
			passwordHash: undefined,
			name: 'Alice',
			roles: ['admin', 'editor'],
		})
		expect(JSON.parse(stdout.text)).toEqual(expectedPerson)
		expect(stderr.text).toBe('')
		expect(stdout.text).not.toContain('Created person')
	})

	test('a bcrypt hash from an environment variable is sent as passwordHash', async () => {
		answerWith({ signUp: { ok: true, result: { person: personRow } } })
		process.env.TEST_PERSON_HASH = '$2b$10$abcdefghijklmnopqrstuv'
		const { output } = createTestOutput()

		await new TenantPersonCreateCommand(createProvider()).run(['alice@example.com', '--password-hash-env', 'TEST_PERSON_HASH'], output)

		expect(requests[0].variables).toEqual({ email: 'alice@example.com', passwordHash: '$2b$10$abcdefghijklmnopqrstuv' })
		delete process.env.TEST_PERSON_HASH
	})

	test('a captcha token from an environment variable reaches signUp without entering argv', async () => {
		answerWith({ signUp: { ok: true, result: { person: personRow } } })
		const { output } = createTestOutput()

		await new TenantPersonCreateCommand(createProvider(), undefined, name => name === 'CAPTCHA' ? 'captcha-secret' : undefined).run(
			['alice@example.com', '--captcha-token-env', 'CAPTCHA'],
			output,
		)

		expect(requests[0].variables).toEqual({ email: 'alice@example.com', captchaToken: 'captcha-secret' })
	})

	test('a stdin captcha token loses one line ending and preserves other whitespace', async () => {
		answerWith({ signUp: { ok: true, result: { person: personRow } } })
		const { output } = createTestOutput()

		await new TenantPersonCreateCommand(createProvider(), async () => ' captcha-secret \r\n').run(
			['alice@example.com', '--captcha-token-stdin'],
			output,
		)

		expect(requests[0].variables).toEqual({ email: 'alice@example.com', captchaToken: ' captcha-secret ' })
	})

	test('rejects two whole-stdin consumers before reading stdin', async () => {
		let reads = 0
		const { output } = createTestOutput()

		await expectCliError(
			() =>
				new TenantPersonCreateCommand(createProvider(), async () => {
					reads++
					return 'secret'
				}).run(['alice@example.com', '--password-stdin', '--captcha-token-stdin'], output),
			'AMBIGUOUS_STDIN_INPUT',
			ExitCode.InputError,
		)
		expect(reads).toBe(0)
		expect(requests).toHaveLength(0)
	})

	test('a hash that is not bcrypt $2b$ is rejected before the rate limit is spent', async () => {
		process.env.TEST_PERSON_HASH = '$2y$10$abcdefghijklmnopqrstuv'
		const { output } = createTestOutput()

		await expectCliError(
			() => new TenantPersonCreateCommand(createProvider()).run(['alice@example.com', '--password-hash-env', 'TEST_PERSON_HASH'], output),
			'INVALID_PASSWORD_HASH',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
		delete process.env.TEST_PERSON_HASH
	})

	test('two secret sources at once is an input error', async () => {
		process.env.TEST_PERSON_PASSWORD = 'sekret'
		const { output } = createTestOutput()

		await expectCliError(
			() =>
				new TenantPersonCreateCommand(createProvider(), async () => 'sekret').run(
					['alice@example.com', '--password-stdin', '--password-env', 'TEST_PERSON_PASSWORD'],
					output,
				),
			'AMBIGUOUS_SECRET_SOURCE',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
		delete process.env.TEST_PERSON_PASSWORD
	})

	test('an unset environment variable is an input error', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			() => new TenantPersonCreateCommand(createProvider()).run(['alice@example.com', '--password-env', 'TEST_PERSON_MISSING'], output),
			'SECRET_ENV_NOT_SET',
			ExitCode.InputError,
		)
	})

	test('creating without a password warns but still signs the person up', async () => {
		answerWith({ signUp: { ok: true, result: { person: personRow } } })
		const { output, stderr } = createTestOutput()

		await new TenantPersonCreateCommand(createProvider()).run(['alice@example.com'], output)

		expect(stderr.text).toContain('No password given.')
		// neither password variable is sent, so the tenant creates the person with no credential at all
		expect(requests[0].variables).toEqual({ email: 'alice@example.com' })
	})

	test('a tenant error code is surfaced with its exit code', async () => {
		answerWith({ signUp: { ok: false, error: { code: 'EMAIL_ALREADY_EXISTS', developerMessage: 'taken' } } })
		const { output } = createTestOutput()

		await expectCliError(
			() => new TenantPersonCreateCommand(createProvider()).run(['alice@example.com'], output),
			'EMAIL_ALREADY_EXISTS',
			ExitCode.Conflict,
		)
	})

	test('recovery details are allowlisted in human and JSON errors', async () => {
		const secret = 'server-only-secret'
		answerWith({
			signUp: {
				ok: false,
				error: {
					code: 'EMAIL_ALREADY_EXISTS',
					developerMessage: 'account exists',
					weakPasswordReasons: ['TOO_SHORT', 'SERVER_INVENTED_REASON'],
					recommendedAction: 'RESET_PASSWORD',
					secret,
				},
			},
		})
		const { output } = createTestOutput()
		const error = await expectCliError(
			() => new TenantPersonCreateCommand(createProvider()).run(['alice@example.com'], output),
			'EMAIL_ALREADY_EXISTS',
			ExitCode.Conflict,
		)
		expect(requests[0].query).toContain('weakPasswordReasons')
		expect(requests[0].query).toContain('recommendedAction')
		expect(error.details).toEqual({
			operation: 'signUp(alice@example.com)',
			code: 'EMAIL_ALREADY_EXISTS',
			developerMessage: 'account exists',
			weakPasswordReasons: ['TOO_SHORT'],
			recommendedAction: 'RESET_PASSWORD',
		})
		expect(JSON.stringify(error.details)).not.toContain(secret)

		const human = createTestOutput()
		renderCliError(error, human.output)
		expect(human.stderr.text).toContain('EMAIL_ALREADY_EXISTS')
		expect(human.stderr.text).not.toContain(secret)

		const json = createTestOutput()
		json.output.setMode('json')
		renderCliError(error, json.output)
		expect(JSON.parse(json.stderr.text).error.details).toEqual(error.details)
		expect(json.stderr.text).not.toContain(secret)
	})

	test('the sign-up rate limit is reported as retryable', async () => {
		answerWith({ signUp: { ok: false, error: { code: 'RATE_LIMIT_EXCEEDED', developerMessage: 'retry after 3600s' } } })
		const { output } = createTestOutput()

		await expectCliError(
			() => new TenantPersonCreateCommand(createProvider()).run(['alice@example.com'], output),
			'RATE_LIMIT_EXCEEDED',
			ExitCode.Transient,
		)
	})
})

describe('tenant person update', () => {
	test('rejects an empty person name before the network', async () => {
		const { output } = createTestOutput()
		await expectCliError(
			() => new TenantPersonUpdateCommand(createProvider()).run(['p1', '--name', ''], output),
			'EMPTY_NAME',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
	})

	test('without any field it is an input error', async () => {
		const { output } = createTestOutput()

		await expectCliError(() => new TenantPersonUpdateCommand(createProvider()).run(['p1'], output), 'NOTHING_TO_UPDATE', ExitCode.InputError)
		expect(requests).toHaveLength(0)
	})

	test('only the given field is sent and reported', async () => {
		answerWith({ changeProfile: { ok: true } })
		const { output, stdout } = createTestOutput()

		await new TenantPersonUpdateCommand(createProvider()).run(['p1', '--email', 'new@example.com', '--json'], output)

		expect(requests[0].variables).toEqual({ personId: 'p1', email: 'new@example.com', name: undefined })
		expect(JSON.parse(stdout.text)).toEqual({ personId: 'p1', email: 'new@example.com', name: null })
	})
})

describe('tenant person set-password', () => {
	test('preserves allowlisted weak-password reasons', async () => {
		answerWith({ changePassword: { ok: false, error: { code: 'TOO_WEAK', developerMessage: 'weak', weakPasswordReasons: ['COMPROMISED'] } } })
		const { output } = createTestOutput()
		const error = await expectCliError(
			() => new TenantPersonSetPasswordCommand(createProvider(), async () => 'sekret').run(['p1', '--password-stdin', '--yes'], output),
			'TOO_WEAK',
			ExitCode.InputError,
		)
		expect(requests[0].query).toContain('weakPasswordReasons')
		expect(error.details).toMatchObject({ weakPasswordReasons: ['COMPROMISED'] })
	})

	test('refuses to run non-interactively without --yes', async () => {
		process.env.TEST_PERSON_PASSWORD = 'sekret'
		const { output } = createTestOutput()

		await expectCliError(
			() => new TenantPersonSetPasswordCommand(createProvider()).run(['p1', '--password-env', 'TEST_PERSON_PASSWORD'], output),
			'TTY_UNAVAILABLE',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
		delete process.env.TEST_PERSON_PASSWORD
	})

	test('with --yes it sends the password read from stdin', async () => {
		answerWith({ changePassword: { ok: true } })
		const { output, stdout } = createTestOutput()

		await new TenantPersonSetPasswordCommand(createProvider(), async () => 'sekret\n').run(['p1', '--password-stdin', '--yes', '--json'], output)

		expect(requests[0].variables).toEqual({ personId: 'p1', password: 'sekret' })
		expect(JSON.parse(stdout.text)).toEqual({ personId: 'p1', passwordChanged: true })
	})

	test('without a password source it is an input error', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			() => new TenantPersonSetPasswordCommand(createProvider()).run(['p1', '--yes'], output),
			'PASSWORD_REQUIRED',
			ExitCode.InputError,
		)
	})
})

describe('tenant person disable', () => {
	test('refuses to run non-interactively without --yes', async () => {
		const { output } = createTestOutput()

		await expectCliError(() => new TenantPersonDisableCommand(createProvider()).run(['p1'], output), 'TTY_UNAVAILABLE', ExitCode.InputError)
		expect(requests).toHaveLength(0)
	})

	test('with --yes it disables the person and reports it as data', async () => {
		answerWith({ disablePerson: { ok: true } })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPersonDisableCommand(createProvider()).run(['p1', '--yes', '--json'], output)

		expect(requests[0].variables).toEqual({ personId: 'p1' })
		expect(JSON.parse(stdout.text)).toEqual({ personId: 'p1', disabled: true })
		// JSON mode suppresses human diagnostics, so stdout remains the only output channel.
		expect(stderr.text).toBe('')
	})

	test('an already disabled person is a conflict', async () => {
		answerWith({ disablePerson: { ok: false, error: { code: 'PERSON_ALREADY_DISABLED', developerMessage: 'already off' } } })
		const { output } = createTestOutput()

		await expectCliError(
			() => new TenantPersonDisableCommand(createProvider()).run(['p1', '--yes'], output),
			'PERSON_ALREADY_DISABLED',
			ExitCode.Conflict,
		)
	})
})

describe('tenant person sign-out', () => {
	test('help and human output describe permanent API-key invalidation', async () => {
		const command = new TenantPersonSignOutCommand(createProvider())
		expect(command.getConfiguration().getDescription()).toContain('permanent keys')
		answerWith({ forceSignOutPerson: { ok: true } })
		const { output, stderr } = createTestOutput()

		await command.run(['p1', '--yes'], output)

		expect(stderr.text).toContain('permanent keys')
	})

	test('refuses to run non-interactively without --yes', async () => {
		const { output } = createTestOutput()

		await expectCliError(() => new TenantPersonSignOutCommand(createProvider()).run(['p1'], output), 'TTY_UNAVAILABLE', ExitCode.InputError)
	})

	test('the reason travels to the API and back into the result', async () => {
		answerWith({ forceSignOutPerson: { ok: true } })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPersonSignOutCommand(createProvider()).run(['p1', '--reason', 'INC-42', '--yes', '--json'], output)

		expect(requests[0].variables).toEqual({ personId: 'p1', reason: 'INC-42' })
		expect(JSON.parse(stdout.text)).toEqual({ personId: 'p1', signedOut: true, reason: 'INC-42' })
		expect(stderr.text).toBe('')
	})
})

describe('tenant person reset-mfa', () => {
	test('refuses to run non-interactively without --yes', async () => {
		const { output } = createTestOutput()

		await expectCliError(() => new TenantPersonResetMfaCommand(createProvider()).run(['p1'], output), 'TTY_UNAVAILABLE', ExitCode.InputError)
	})

	test('the result spells out every factor that was cleared', async () => {
		answerWith({ resetPersonMfa: { ok: true } })
		const { output, stdout } = createTestOutput()

		await new TenantPersonResetMfaCommand(createProvider()).run(['p1', '--yes', '--json'], output)

		expect(JSON.parse(stdout.text)).toEqual({
			personId: 'p1',
			mfaReset: true,
			totpDisabled: true,
			emailOtpDisabled: true,
			backupCodesDeleted: true,
		})
	})
})

describe('tenant person reset-password-request', () => {
	test('the mail options travel as the options input', async () => {
		answerWith({ createResetPasswordRequest: { ok: true } })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantPersonResetPasswordRequestCommand(createProvider()).run(
			['alice@example.com', '--mail-project', 'blog', '--mail-variant', 'cs', '--json'],
			output,
		)

		expect(requests[0].variables).toEqual({ email: 'alice@example.com', options: { mailProject: 'blog', mailVariant: 'cs' } })
		expect(JSON.parse(stdout.text)).toEqual({ email: 'alice@example.com', requested: true, mailProject: 'blog', mailVariant: 'cs' })
		// JSON mode contains only the stable payload; the command help documents the anti-enumeration behavior.
		expect(stderr.text).toBe('')
	})

	test('a captcha token from stdin reaches createResetPasswordRequest', async () => {
		answerWith({ createResetPasswordRequest: { ok: true } })
		const { output } = createTestOutput()

		await new TenantPersonResetPasswordRequestCommand(createProvider(), async () => 'captcha-secret').run(
			['alice@example.com', '--captcha-token-stdin'],
			output,
		)

		expect(requests[0].variables).toEqual({ email: 'alice@example.com', options: {}, captchaToken: 'captcha-secret' })
	})
})

describe('tenant session create', () => {
	const SESSION_TOKEN = 'd'.repeat(40)
	const sessionResult = {
		ok: true,
		result: {
			token: SESSION_TOKEN,
			person: { id: 'p1', email: 'alice@example.com', name: 'Alice', identity: { id: 'i1' } },
		},
	}

	test('requires exactly one person identifier and sends nothing when invalid', async () => {
		const { output } = createTestOutput()

		await expectCliError(() => new TenantSessionCreateCommand(createProvider()).run([], output), 'INVALID_PERSON_IDENTIFIER', ExitCode.InputError)
		await expectCliError(
			() => new TenantSessionCreateCommand(createProvider()).run(['--email', 'alice@example.com', '--person-id', 'p1'], output),
			'INVALID_PERSON_IDENTIFIER',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
	})

	test('rejects empty person identifiers before sending a request', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			() => new TenantSessionCreateCommand(createProvider()).run(['--email', '   '], output),
			'INVALID_PERSON_IDENTIFIER',
			ExitCode.InputError,
		)
		await expectCliError(
			() => new TenantSessionCreateCommand(createProvider()).run(['--person-id', ''], output),
			'INVALID_PERSON_IDENTIFIER',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
	})

	test('rejects zero and out-of-range GraphQL Int expirations', async () => {
		for (const expiration of ['0', '2147483648']) {
			const { output } = createTestOutput()
			await expectCliError(
				() => new TenantSessionCreateCommand(createProvider()).run(['--person-id', 'p1', '--expiration', expiration], output),
				'INVALID_OPTION_VALUE',
				ExitCode.InputError,
			)
		}
		expect(requests).toHaveLength(0)
	})

	test('rejects negative and empty expiration values as input errors', async () => {
		const { output } = createTestOutput()
		await expectCliError(
			() => new TenantSessionCreateCommand(createProvider()).run(['--person-id', 'p1', '--expiration', '-1'], output),
			'INVALID_INPUT',
			ExitCode.InputError,
		)
		await expectCliError(
			() => new TenantSessionCreateCommand(createProvider()).run(['--person-id', 'p1', '--expiration', ''], output),
			'INVALID_OPTION_VALUE',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
	})

	test('forwards the session lifetime in minutes and emits structured JSON', async () => {
		answerWith({ createSessionToken: sessionResult })
		const { output, stdout, stderr } = createTestOutput()
		const command = new TenantSessionCreateCommand(createProvider())
		const expirationOption = command.getConfiguration().getOptions().find(it => it.name === 'expiration')

		expect(expirationOption?.description).toBe('Session lifetime in minutes as a positive integer.')

		await command.run(
			['--person-id', 'p1', '--expiration', '15', '--trust-forwarded-client-info', '--json'],
			output,
		)

		expect(requests[0].variables).toEqual({
			email: undefined,
			personId: 'p1',
			expiration: 15,
			options: { trustForwardedClientInfo: true },
		})
		expect(JSON.parse(stdout.text)).toEqual({
			token: SESSION_TOKEN,
			personId: 'p1',
			identityId: 'i1',
			email: 'alice@example.com',
			name: 'Alice',
		})
		expect(stderr.text).toBe('')
	})

	test('--quiet prints only the token and never sends it to stderr', async () => {
		answerWith({ createSessionToken: sessionResult })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantSessionCreateCommand(createProvider()).run(['--email', 'alice@example.com', '--quiet'], output)

		expect(stdout.lines).toEqual([SESSION_TOKEN])
		expect(stderr.text).toBe('')
	})

	test('human mode labels the one-time token without writing it to stderr', async () => {
		answerWith({ createSessionToken: sessionResult })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantSessionCreateCommand(createProvider()).run(['--email', 'alice@example.com'], output)

		expect(stdout.text).toContain('Session token for person p1:')
		expect(stdout.text).toContain(SESSION_TOKEN)
		expect(stderr.text).not.toContain(SESSION_TOKEN)
	})

	test('rejects a malformed session token without printing it', async () => {
		const malformedToken = `secret\u001b]8;;https://attacker.test\u0007\r\u0085tail`
		answerWith({
			createSessionToken: {
				...sessionResult,
				result: { ...sessionResult.result, token: malformedToken },
			},
		})
		const { output, stdout, stderr } = createTestOutput()

		try {
			await new TenantSessionCreateCommand(createProvider()).run(['--person-id', 'p1'], output)
			throw new Error('expected malformed credential to fail')
		} catch (error) {
			expect(error).toMatchObject({ code: 'TENANT_API_INVALID_CREDENTIAL', exitCode: ExitCode.InternalError })
			expect(error instanceof Error ? error.message : '').not.toContain(malformedToken)
		}
		expect(stdout.text).toBe('')
		expect(stderr.text).toBe('')
	})
})

describe('tenant identity role', () => {
	test('add takes variadic roles and reports the resulting role set', async () => {
		answerWith({ addGlobalIdentityRoles: { ok: true, result: { identity: { id: 'i1', roles: ['admin', 'editor'] } } } })
		const { output, stdout, stderr } = createTestOutput()

		await new TenantIdentityRoleAddCommand(createProvider()).run(['i1', 'admin', 'editor', '--json'], output)

		expect(requests[0].variables).toEqual({ identityId: 'i1', roles: ['admin', 'editor'] })
		expect(JSON.parse(stdout.text)).toEqual({ identityId: 'i1', added: ['admin', 'editor'], roles: ['admin', 'editor'] })
		expect(stderr.text).toBe('')
	})

	test('add reports null roles when the token may not read them', async () => {
		answerWith({ addGlobalIdentityRoles: { ok: true, result: { identity: { id: 'i1', roles: null } } } })
		const { output, stdout } = createTestOutput()

		await new TenantIdentityRoleAddCommand(createProvider()).run(['i1', 'admin', '--json'], output)

		expect(JSON.parse(stdout.text)).toEqual({ identityId: 'i1', added: ['admin'], roles: null })
	})

	test('an unknown role is an input error', async () => {
		answerWith({ addGlobalIdentityRoles: { ok: false, error: { code: 'INVALID_ROLE', developerMessage: 'no such role' } } })
		const { output } = createTestOutput()

		await expectCliError(() => new TenantIdentityRoleAddCommand(createProvider()).run(['i1', 'nope'], output), 'INVALID_ROLE', ExitCode.InputError)
	})

	test('remove refuses to run non-interactively without --yes', async () => {
		const { output } = createTestOutput()

		await expectCliError(
			() => new TenantIdentityRoleRemoveCommand(createProvider()).run(['i1', 'admin'], output),
			'TTY_UNAVAILABLE',
			ExitCode.InputError,
		)
		expect(requests).toHaveLength(0)
	})

	test('remove with --yes reports what is left', async () => {
		answerWith({ removeGlobalIdentityRoles: { ok: true, result: { identity: { id: 'i1', roles: ['editor'] } } } })
		const { output, stdout } = createTestOutput()

		await new TenantIdentityRoleRemoveCommand(createProvider()).run(['i1', 'admin', '--yes', '--json'], output)

		expect(requests[0].variables).toEqual({ identityId: 'i1', roles: ['admin'] })
		expect(JSON.parse(stdout.text)).toEqual({ identityId: 'i1', removed: ['admin'], roles: ['editor'] })
	})
})
