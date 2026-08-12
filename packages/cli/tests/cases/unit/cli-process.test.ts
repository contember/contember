import { describe, expect, test } from 'bun:test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import { join, resolve } from 'node:path'
import { ExitCode } from '@contember/cli-common'

const repoRoot = resolve(import.meta.dir, '../../../../..')
const cliEntry = join(repoRoot, 'packages/cli/src/run.ts')
const builtCliEntry = join(repoRoot, 'packages/cli/dist/production/run.js')
const cliPackageJson = join(repoRoot, 'packages/cli/package.json')
const testBuiltCli = process.env.CONTEMBER_TEST_BUILT_CLI === '1'
const workspace = fs.mkdtempSync(join(os.tmpdir(), 'contember-cli-process-'))
fs.mkdirSync(join(workspace, 'api/migrations'), { recursive: true })

const readCliPackageVersion = (): string => {
	const packageJson: unknown = JSON.parse(fs.readFileSync(cliPackageJson, 'utf8'))
	if (
		typeof packageJson !== 'object'
		|| packageJson === null
		|| !('version' in packageJson)
		|| typeof packageJson.version !== 'string'
		|| packageJson.version.length === 0
	) {
		throw new Error('CLI package version is missing')
	}
	return packageJson.version
}

const runCli = async (args: string[]) => {
	const proc = Bun.spawn(['bun', '--conditions=typescript', cliEntry, ...args], {
		cwd: repoRoot,
		env: { ...process.env, CONTEMBER_SKIP_VERSION_CHECK: '1', CONTEMBER_DIR: workspace, NO_COLOR: '1' },
		stdout: 'pipe',
		stderr: 'pipe',
	})
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	])
	return { stdout, stderr, exitCode }
}

const shellQuote = (value: string): string => `'${value.replaceAll("'", "'\\''")}'`

const cliCommand = (args: string[]): string => ['bun', '--conditions=typescript', cliEntry, ...args].map(shellQuote).join(' ')

const shellEnv = { ...process.env, CONTEMBER_SKIP_VERSION_CHECK: '1', CONTEMBER_DIR: workspace, NO_COLOR: '1' }

/**
 * Runs the CLI on the left hand side of a real shell pipe and reports its own exit status.
 *
 * `Bun.spawn({ stdout: 'pipe' })` does not reproduce a truncated stdout — it hands the child a stream
 * that swallows the whole payload. Only an OS pipe with its 64 KB buffer does, so this has to go
 * through a shell.
 */
const runPiped = async (args: string[], statusFileName: string) => {
	const statusFile = join(workspace, statusFileName)
	const proc = Bun.spawn(['sh', '-c', `{ ${cliCommand(args)}; echo $? > ${shellQuote(statusFile)}; } | cat`], {
		cwd: repoRoot,
		env: shellEnv,
		stdout: 'pipe',
		stderr: 'pipe',
	})
	const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
	await proc.exited
	return { stdout, stderr, exitCode: Number(fs.readFileSync(statusFile, 'utf8').trim()) }
}

const runRedirected = async (args: string[], targetFileName: string) => {
	const target = join(workspace, targetFileName)
	const proc = Bun.spawn(['sh', '-c', `${cliCommand(args)} > ${shellQuote(target)}`], { cwd: repoRoot, env: shellEnv, stdout: 'pipe', stderr: 'pipe' })
	const exitCode = await proc.exited
	return { text: fs.readFileSync(target, 'utf8'), exitCode }
}

describe('stdout and stderr separation', () => {
	test.skipIf(!testBuiltCli)('the built ESM entrypoint starts under Node', async () => {
		if (!fs.existsSync(builtCliEntry)) {
			throw new Error(`Built CLI entrypoint is missing: ${builtCliEntry}`)
		}
		const proc = Bun.spawn(['node', builtCliEntry, 'version', '--json'], {
			cwd: repoRoot,
			env: { ...shellEnv, CONTEMBER_CLI_PACKAGE_ROOT: '' },
			stdout: 'pipe',
			stderr: 'pipe',
		})
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
			proc.exited,
		])

		expect(exitCode).toBe(0)
		expect(JSON.parse(stdout)).toBe(readCliPackageVersion())
		expect(stderr).toBe('')
	}, 30000)

	test('a successful command writes only to stdout', async () => {
		const result = await runCli(['version'])
		expect(result.exitCode).toBe(0)
		expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)
		expect(result.stderr).toBe('')
	}, 30000)

	test('--json prints a parseable value on stdout and nothing on stderr', async () => {
		const result = await runCli(['version', '--json'])
		expect(result.exitCode).toBe(0)
		expect(typeof JSON.parse(result.stdout)).toBe('string')
		expect(result.stderr).toBe('')
	}, 30000)

	test('--quiet prints the bare value', async () => {
		const result = await runCli(['version', '--quiet'])
		expect(result.exitCode).toBe(0)
		expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)
		expect(result.stderr).toBe('')
	}, 30000)
})

describe('command resolution', () => {
	test('a colon alias behaves exactly like the canonical name and warns about nothing', async () => {
		const [alias, canonical] = await Promise.all([runCli(['migrations:snapshot', '--help']), runCli(['migrations', 'snapshot', '--help'])])
		expect(alias.exitCode).toBe(0)
		expect(alias.stdout).toBe('')
		expect(alias.stderr).toBe(canonical.stderr)
		expect(alias.stderr.toLowerCase()).not.toContain('deprecat')
	}, 30000)

	test('the legacy colon form of a real run still works', async () => {
		// the empty workspace makes it fail, but on its own error — not on an unknown command
		const result = await runCli(['migrations:snapshot'])
		expect(result.exitCode).toBe(ExitCode.NotFound)
		expect(result.stderr).toContain('No migrations to snapshot')
		expect(result.stderr).not.toContain('COMMAND_NOT_FOUND')
	}, 30000)

	test('a group prints its commands to stderr and exits with 0', async () => {
		const result = await runCli(['tenant'])
		expect(result.exitCode).toBe(0)
		expect(result.stdout).toBe('')
		expect(result.stderr).toContain('tenant apply')
	}, 30000)

	test('an unknown command exits with 1', async () => {
		const result = await runCli(['nonsense'])
		expect(result.exitCode).toBe(1)
		expect(result.stdout).toBe('')
		expect(result.stderr).toContain('COMMAND_NOT_FOUND')
	}, 30000)
})

describe('commands', () => {
	test('--json prints valid JSON on stdout', async () => {
		const result = await runCli(['commands', '--json'])
		expect(result.exitCode).toBe(0)
		expect(result.stderr).toBe('')
		const commands = JSON.parse(result.stdout)
		expect(Array.isArray(commands)).toBe(true)
		const names = commands.map((it: { name: string }) => it.name)
		expect(names).toContain('migrations diff')
		expect(names).toContain('version')
		const diff = commands.find((it: { name: string }) => it.name === 'migrations diff')
		expect(diff.aliases).toStrictEqual(['migrations:diff'])
		expect(diff.group).toBe('migrations')
		expect(diff.arguments.map((it: { name: string }) => it.name)).toStrictEqual(['migrationName'])
		expect(diff.options.map((it: { name: string }) => it.name)).toContain('json')
	}, 30000)
})

describe('piped stdout', () => {
	test('a --json payload larger than the pipe buffer is not truncated', async () => {
		const piped = await runPiped(['commands', '--json'], 'piped-status')
		const redirected = await runRedirected(['commands', '--json'], 'redirected.json')

		// the whole point of this test is a payload above the 64 KB pipe buffer — if the catalog ever
		// shrinks below it, this assertion fails loudly instead of the test quietly proving nothing
		expect(redirected.text.length).toBeGreaterThan(65536)

		expect(piped.stdout.length).toBe(redirected.text.length)
		expect(JSON.parse(piped.stdout)).toStrictEqual(JSON.parse(redirected.text))
		expect(piped.exitCode).toBe(0)
		expect(piped.stderr).toBe('')
	}, 60000)

	test('a reader that goes away does not hang the CLI or leak a stack trace', async () => {
		const proc = Bun.spawn(['sh', '-c', `${cliCommand(['commands', '--json'])} | head -c 100`], {
			cwd: repoRoot,
			env: shellEnv,
			stdout: 'pipe',
			stderr: 'pipe',
		})
		const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
		await proc.exited
		expect(stdout.length).toBe(100)
		expect(stderr).not.toContain('EPIPE')
		expect(stderr).not.toContain('Unhandled')
	}, 30000)
})

describe('errors', () => {
	test('a global option is not stripped before the command parses argv', async () => {
		const result = await runCli(['project', 'print-schema', '--format', '--quiet', 'introspection'])
		expect(result.exitCode).toBe(1)
		expect(result.stdout).toBe('')
		expect(result.stderr).toContain('Undefined value for option --format')
	}, 30000)

	test('--json renders the error envelope on stderr', async () => {
		const result = await runCli(['nonsense', '--json'])
		expect(result.exitCode).toBe(1)
		expect(result.stdout).toBe('')
		const envelope = JSON.parse(result.stderr)
		expect(envelope.ok).toBe(false)
		expect(envelope.error.code).toBe('COMMAND_NOT_FOUND')
		expect(envelope.error.retryable).toBe(false)
	}, 30000)

	test('--json applies before a fallible bootstrap step', async () => {
		const missingPackageRoot = join(workspace, 'missing-package-root')
		const proc = Bun.spawn(['bun', '--conditions=typescript', cliEntry, '--json'], {
			cwd: repoRoot,
			env: { ...shellEnv, CONTEMBER_CLI_PACKAGE_ROOT: missingPackageRoot },
			stdout: 'pipe',
			stderr: 'pipe',
		})
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
			proc.exited,
		])

		expect(exitCode).toBe(2)
		expect(stdout).toBe('')
		const envelope = JSON.parse(stderr)
		expect(envelope.ok).toBe(false)
		expect(envelope.error.code).toBe('UNKNOWN')
	}, 30000)

	test('--json rejects an empty CLI package version as a bootstrap error', async () => {
		const emptyVersionPackageRoot = join(workspace, 'empty-version-package-root')
		fs.mkdirSync(emptyVersionPackageRoot)
		fs.writeFileSync(join(emptyVersionPackageRoot, 'package.json'), JSON.stringify({ version: '' }))
		const proc = Bun.spawn(['bun', '--conditions=typescript', cliEntry, '--json'], {
			cwd: repoRoot,
			env: { ...shellEnv, CONTEMBER_CLI_PACKAGE_ROOT: emptyVersionPackageRoot },
			stdout: 'pipe',
			stderr: 'pipe',
		})
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
			proc.exited,
		])

		expect(exitCode).toBe(2)
		expect(stdout).toBe('')
		const envelope = JSON.parse(stderr)
		expect(envelope.ok).toBe(false)
		expect(envelope.error.code).toBe('UNKNOWN')
	}, 30000)
})
