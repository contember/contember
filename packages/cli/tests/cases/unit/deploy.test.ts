import { afterEach, describe, expect, test } from 'bun:test'
import { CliError, ExitCode, Input, Output, OutputStream } from '@contember/cli-common'
import prompts from 'prompts'
import { AdminClient } from '../../../src/lib/admin/AdminClient.js'
import { AdminDeployer } from '../../../src/lib/admin/AdminDeployer.js'
import { DeployCommand, DeployResult } from '../../../src/commands/deploy/DeployCommand.js'
import { FileSystem } from '../../../src/lib/fs/FileSystem.js'
import { MigrationExecutionFacade } from '../../../src/lib/migrations/MigrationExecutionFacade.js'
import { RemoteProjectProvider } from '../../../src/lib/project/RemoteProjectProvider.js'
import { RemoteProjectResolver } from '../../../src/lib/project/RemoteProjectResolver.js'
import { Workspace } from '../../../src/lib/workspace/Workspace.js'
import { RemoteProject } from '../../../src/lib/project/RemoteProject.js'

// Mirrors packages/cli-common/tests/lib/testOutput.ts — that helper isn't part of the package's
// public exports, so it can't be imported across the package boundary.
class CapturingStream implements OutputStream {
	public chunks: string[] = []

	constructor(public readonly isTty: boolean = false) {}

	public write(text: string): void {
		this.chunks.push(text)
	}

	public get text(): string {
		return this.chunks.join('')
	}
}

const createTestOutput = ({ stdinTty = false }: { stdinTty?: boolean } = {}) => {
	const stdout = new CapturingStream()
	const stderr = new CapturingStream()
	return { stdout, stderr, output: new Output({ stdout, stderr, isStdinTty: () => stdinTty }) }
}

// pathExists is the only FileSystem method DeployCommand touches directly.
class StubFileSystem extends FileSystem {
	constructor(private readonly exists: boolean) {
		super()
	}

	public override pathExists = async (): Promise<boolean> => this.exists
}

// Overrides the whole `deploy` field so the real AdminClient (and its network call) is never reached.
class RecordingAdminDeployer extends AdminDeployer {
	public calls: { dir: string; root: boolean }[] = []

	public override deploy = async ({ dir, root }: { dir: string; root: boolean }): Promise<void> => {
		this.calls.push({ dir, root })
	}
}

const TOKEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345'
const originalFetch = globalThis.fetch
const adminHttpCases: ReadonlyArray<readonly [number, string, ExitCode]> = [
	[401, 'ADMIN_API_UNAUTHORIZED', ExitCode.Forbidden],
	[403, 'ADMIN_API_FORBIDDEN', ExitCode.Forbidden],
	[404, 'ADMIN_API_NOT_FOUND', ExitCode.NotFound],
	[409, 'ADMIN_API_CONFLICT', ExitCode.Conflict],
	[408, 'ADMIN_API_TIMEOUT', ExitCode.Transient],
	[425, 'ADMIN_API_TOO_EARLY', ExitCode.Transient],
	[429, 'ADMIN_API_RATE_LIMITED', ExitCode.Transient],
	[500, 'ADMIN_API_SERVER_ERROR', ExitCode.Transient],
	[422, 'ADMIN_API_BAD_REQUEST', ExitCode.InputError],
]

afterEach(() => {
	globalThis.fetch = originalFetch
})

const buildCommand = ({
	adminDistDir,
	facadeConfirmed = false,
	facadeResult = true,
	apiUrl = 'https://api.example.com',
}: {
	adminDistDir?: string
	facadeConfirmed?: boolean
	facadeResult?: boolean
	apiUrl?: string
} = {}) => {
	const remoteProjectProvider = new RemoteProjectProvider()
	const remoteProjectResolver = new RemoteProjectResolver({
		apiUrl,
		apiToken: TOKEN,
		projectName: 'blog',
	})
	const adminDeployer = new RecordingAdminDeployer(
		new RemoteProjectProvider(),
		new AdminClient(new RemoteProjectProvider()),
		new FileSystem(),
		createTestOutput().output,
	)
	const facadeCalls: unknown[] = []
	// Narrowed on DeployCommand to `Pick<MigrationExecutionFacade, 'execute'>` (see DeployCommand.ts) —
	// the real facade's dependency graph is deep and partly external, impractical to build for a test.
	const migrationExecutionFacade: Pick<MigrationExecutionFacade, 'execute'> = {
		execute: async args => {
			facadeCalls.push(args)
			if (facadeConfirmed) {
				args.onConfirmed?.()
			}
			return facadeResult
		},
	}
	const workspace: Workspace = {
		baseDir: '/project',
		apiDir: '/project/api',
		migrationsDir: '/project/api/migrations',
		adminDir: '/project/admin',
		adminDistDir,
	}
	const command = new DeployCommand(
		adminDeployer,
		migrationExecutionFacade,
		new StubFileSystem(true),
		remoteProjectProvider,
		remoteProjectResolver,
		workspace,
	)
	return { command, adminDeployer, facadeCalls }
}

describe('DeployCommand', () => {
	test('emits the deploy result as data, without the token, in --json mode', async () => {
		const { command, adminDeployer } = buildCommand({ adminDistDir: '/project/admin/dist' })
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('json')

		const input = new Input({}, { admin: 'https://admin.example.com', yes: true })
		const code = await command.execute(input, output)

		expect(code).toBe(0)
		expect(adminDeployer.calls).toStrictEqual([{ dir: '/project/admin/dist', root: false }])

		const printed: DeployResult = JSON.parse(stdout.text)
		expect(printed).toStrictEqual({
			project: 'blog',
			apiUrl: 'https://api.example.com',
			adminUrl: 'https://admin.example.com',
			migrationsDeployed: true,
			adminDeployed: true,
		})
		expect(stdout.text).not.toContain(TOKEN)
		expect(stderr.text).not.toContain(TOKEN)
	})

	test('reports migrations/admin as not deployed when skipped', async () => {
		const { command } = buildCommand({ adminDistDir: undefined })
		const { output, stdout } = createTestOutput()
		output.setMode('json')

		// no admin endpoint and no admin dist dir → deployAdmin is false; migrations still run
		const input = new Input({}, { yes: true })
		const code = await command.execute(input, output)

		expect(code).toBe(0)
		const printed: DeployResult = JSON.parse(stdout.text)
		expect(printed.adminUrl).toBeNull()
		expect(printed.adminDeployed).toBe(false)
		expect(printed.migrationsDeployed).toBe(true)
	})

	test('deploys admin and reports no migrations when the migration facade has no work', async () => {
		const { command, adminDeployer } = buildCommand({
			adminDistDir: '/project/admin/dist',
			facadeResult: false,
		})
		const { output, stdout } = createTestOutput()
		output.setMode('json')

		const code = await command.execute(
			new Input({}, { admin: 'https://admin.example.com', yes: true }),
			output,
		)

		expect(code).toBe(0)
		expect(adminDeployer.calls).toStrictEqual([{ dir: '/project/admin/dist', root: false }])
		expect(JSON.parse(stdout.text)).toStrictEqual({
			project: 'blog',
			apiUrl: 'https://api.example.com',
			adminUrl: 'https://admin.example.com',
			migrationsDeployed: false,
			adminDeployed: true,
		})
	})

	test('emits a no-op result when the migration facade has no work and admin is unavailable', async () => {
		const { command, adminDeployer } = buildCommand({ facadeResult: false })
		const { output, stdout } = createTestOutput()
		output.setMode('json')

		const code = await command.execute(new Input({}, { yes: true }), output)

		expect(code).toBe(0)
		expect(adminDeployer.calls).toStrictEqual([])
		expect(JSON.parse(stdout.text)).toStrictEqual({
			project: 'blog',
			apiUrl: 'https://api.example.com',
			adminUrl: null,
			migrationsDeployed: false,
			adminDeployed: false,
		})
	})

	test('prints the API URL in quiet mode when the migration facade has no work', async () => {
		const { command } = buildCommand({ facadeResult: false })
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('quiet')

		const code = await command.execute(new Input({}, { yes: true }), output)

		expect(code).toBe(0)
		expect(stdout.text).toBe('https://api.example.com\n')
		expect(stderr.text).toBe('')
	})

	test('deploys admin after interactive confirmation when the migration facade has no work', async () => {
		const { command, adminDeployer } = buildCommand({
			adminDistDir: '/project/admin/dist',
			facadeResult: false,
		})
		const { output } = createTestOutput({ stdinTty: true })
		prompts.inject([true])

		const code = await command.execute(new Input({}, { admin: 'https://admin.example.com' }), output)

		expect(code).toBe(0)
		expect(adminDeployer.calls).toStrictEqual([{ dir: '/project/admin/dist', root: false }])
	})

	test('does not deploy admin after interactive confirmation is declined', async () => {
		const { command, adminDeployer } = buildCommand({
			adminDistDir: '/project/admin/dist',
			facadeResult: false,
		})
		const { output } = createTestOutput({ stdinTty: true })
		prompts.inject([false])

		const code = await command.execute(new Input({}, { admin: 'https://admin.example.com' }), output)

		expect(code).toBe(1)
		expect(adminDeployer.calls).toStrictEqual([])
	})

	test('does not require a second confirmation after migration work was confirmed', async () => {
		const { command, adminDeployer } = buildCommand({ adminDistDir: '/project/admin/dist' })
		const { output } = createTestOutput({ stdinTty: false })

		const code = await command.execute(new Input({}, { admin: 'https://admin.example.com' }), output)

		expect(code).toBe(0)
		expect(adminDeployer.calls).toStrictEqual([{ dir: '/project/admin/dist', root: false }])
	})

	test('does not require a second confirmation when confirmed migrations have no pending work', async () => {
		const { command, adminDeployer } = buildCommand({
			adminDistDir: '/project/admin/dist',
			facadeConfirmed: true,
			facadeResult: false,
		})
		const { output } = createTestOutput({ stdinTty: false })

		const code = await command.execute(new Input({}, { admin: 'https://admin.example.com' }), output)

		expect(code).toBe(0)
		expect(adminDeployer.calls).toStrictEqual([{ dir: '/project/admin/dist', root: false }])
	})

	test('refuses an unconfirmed admin deploy when the migration facade returns before prompting', async () => {
		const { command, adminDeployer } = buildCommand({
			adminDistDir: '/project/admin/dist',
			facadeResult: false,
		})
		const { output } = createTestOutput({ stdinTty: false })

		const promise = command.execute(new Input({}, { admin: 'https://admin.example.com' }), output)

		await expect(promise).rejects.toMatchObject({ code: 'TTY_UNAVAILABLE' })
		expect(adminDeployer.calls).toStrictEqual([])
	})

	test('prints only the API URL in quiet mode', async () => {
		const { command } = buildCommand({ adminDistDir: undefined })
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('quiet')

		await command.execute(new Input({}, { yes: true }), output)

		expect(stdout.text).toBe('https://api.example.com\n')
		expect(stderr.text).toBe('')
	})

	test('escapes endpoint control characters in human result output', async () => {
		const { command } = buildCommand({ apiUrl: 'https://api.example.com/\u001b[31m\u0007' })
		const { output, stdout, stderr } = createTestOutput()

		await command.execute(new Input({}, { yes: true }), output)

		expect(stdout.text).not.toContain('\u001b')
		expect(stdout.text).not.toContain('\u0007')
		expect(stdout.text).toContain('API URL: https://api.example.com/[31m')
		expect(stderr.text).not.toContain('\u001b')
		expect(stderr.text).not.toContain('\u0007')
	})

	test('fails with TTY_UNAVAILABLE instead of prompting when stdin is not a TTY and --yes is missing', async () => {
		const { command } = buildCommand({ adminDistDir: '/project/admin/dist' })
		const { output } = createTestOutput({ stdinTty: false })

		// --no-migrations skips the facade's own prompt, reaching DeployCommand's admin-only confirmation
		const input = new Input({}, { admin: 'https://admin.example.com', 'no-migrations': true })

		const promise = command.execute(input, output)
		await expect(promise).rejects.toBeInstanceOf(CliError)
		await expect(promise).rejects.toMatchObject({ code: 'TTY_UNAVAILABLE' })
	})

	test('throws PROJECT_NOT_DEFINED when no DSN or env vars resolve a project', async () => {
		const remoteProjectResolver = new RemoteProjectResolver({})
		const command = new DeployCommand(
			new RecordingAdminDeployer(
				new RemoteProjectProvider(),
				new AdminClient(new RemoteProjectProvider()),
				new FileSystem(),
				createTestOutput().output,
			),
			{ execute: async () => true },
			new StubFileSystem(true),
			new RemoteProjectProvider(),
			remoteProjectResolver,
			{ baseDir: '/project', apiDir: '/project/api', migrationsDir: '/project/api/migrations' },
		)
		const { output } = createTestOutput()

		const promise = command.execute(new Input({}, {}), output)
		await expect(promise).rejects.toBeInstanceOf(CliError)
		await expect(promise).rejects.toMatchObject({ code: 'PROJECT_NOT_DEFINED' })
	})
})

describe('AdminClient transport errors', () => {
	const createClient = () => {
		const provider = new RemoteProjectProvider()
		provider.setRemoteProject(
			new RemoteProject(
				'blog',
				'https://api.example.test',
				'distinctive-admin-token',
				'https://admin.example.test',
			),
		)
		return new AdminClient(provider)
	}

	test.each(adminHttpCases)('classifies HTTP %i without exposing credentials or response bodies', async (status, code, exitCode) => {
		const responseSecret = `distinctive-admin-response-${status}`
		globalThis.fetch = async () =>
			new Response(responseSecret, {
				status,
				headers: { 'retry-after': status === 429 ? '15' : responseSecret },
			})
		const promise = createClient().deploy('blog', [])

		await expect(promise).rejects.toMatchObject({ code, exitCode })
		try {
			await promise
		} catch (error) {
			const serialized = JSON.stringify(error)
			expect(serialized).not.toContain(responseSecret)
			expect(serialized).not.toContain('distinctive-admin-token')
		}
	})

	test('classifies fetch failures as transient without exposing the cause', async () => {
		globalThis.fetch = async () => {
			throw new Error('distinctive-network-secret')
		}
		const promise = createClient().deploy('blog', [])

		await expect(promise).rejects.toMatchObject({
			code: 'ADMIN_API_UNREACHABLE',
			exitCode: ExitCode.Transient,
		})
		try {
			await promise
		} catch (error) {
			expect(JSON.stringify(error)).not.toContain('distinctive-network-secret')
		}
	})
})
