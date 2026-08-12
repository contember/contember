import { describe, expect, test } from 'bun:test'
import { Readable, Writable } from 'node:stream'
import { ChildProcessError, CommandRunner } from '../../../src/npm/CommandRunner.js'
import { createTestOutput } from '../../lib/testOutput.js'

const childScript = `
process.stdout.write('child stdout\\n')
process.stderr.write('child stderr\\n')
`

describe('CommandRunner', () => {
	test('streams child output as human diagnostics while returning stdout', async () => {
		const io = createTestOutput()
		const runner = new CommandRunner(io.output)

		const { output } = runner.runCommand(process.execPath, ['-e', childScript], {
			cwd: process.cwd(),
			display: 'runtime child task',
		})

		expect(await output).toBe('child stdout\n')
		expect(io.stdout.text).toBe('')
		expect(io.stderr.lines).toContain('$ runtime child task')
		expect(io.stderr.lines).toContain('child stdout')
		expect(io.stderr.lines).toContain('child stderr')
	})

	test('keeps the zero-argument constructor, legacy error constructor and human stream forwarding', async () => {
		const stdout: string[] = []
		const stderr: string[] = []
		const stdoutStream = collectingWritable(stdout)
		const stderrStream = collectingWritable(stderr)
		const runner = new CommandRunner()

		const { output } = runner.runCommand(process.execPath, ['-e', childScript], {
			cwd: process.cwd(),
			stdout: stdoutStream,
			stderr: stderrStream,
		})

		expect(await output).toBe('child stdout\n')
		expect(stdout.join('')).toBe('child stdout\n')
		expect(stderr.join('')).toBe('child stderr\n')
		const legacyError = new ChildProcessError(9, 'legacy stderr')
		expect(legacyError.stdout).toBe('')
		expect(legacyError.stderr).toBe('legacy stderr')
	})

	for (const mode of ['json', 'quiet'] as const) {
		test(`suppresses command and child diagnostics in ${mode} mode`, async () => {
			const io = createTestOutput()
			io.output.setMode(mode)
			const runner = new CommandRunner(io.output)

			const forwarded: string[] = []
			const { output } = runner.runCommand(process.execPath, ['-e', childScript], {
				cwd: process.cwd(),
				stdout: collectingWritable(forwarded),
				stderr: collectingWritable(forwarded),
				display: 'safe child task',
			})

			expect(await output).toBe('child stdout\n')
			expect(forwarded).toEqual([])
			expect(io.stdout.text).toBe('')
			expect(io.stderr.text).toBe('')
		})
	}

	test('retains captured output on a non-zero child failure without printing in JSON mode', async () => {
		const io = createTestOutput()
		io.output.setMode('json')
		const runner = new CommandRunner(io.output)
		const script = `${childScript}\nprocess.exitCode = 7`

		const { output } = runner.runCommand(process.execPath, ['-e', script], { cwd: process.cwd() })
		const error = await output.then(() => null, (reason: unknown) => reason)

		if (!(error instanceof ChildProcessError)) {
			throw new Error('Expected ChildProcessError')
		}
		expect(error.exitCode).toBe(7)
		expect(error.stdout).toBe('child stdout\n')
		expect(error.stderr).toBe('child stderr\n')
		expect(error.message).not.toContain('child stderr')
		expect(io.stdout.text).toBe('')
		expect(io.stderr.text).toBe('')
	})

	test('does not expose raw arguments in diagnostics or failure messages', async () => {
		const secret = 'sentinel-secret-do-not-print'
		const io = createTestOutput()
		const runner = new CommandRunner(io.output)
		const script = `process.stderr.write('dependency install failed\\n'); process.exitCode = 8`

		const { output } = runner.runCommand(process.execPath, ['-e', script, secret], {
			cwd: process.cwd(),
			display: 'install dependencies',
		})
		const error = await output.then(() => null, (reason: unknown) => reason)

		if (!(error instanceof ChildProcessError)) {
			throw new Error('Expected ChildProcessError')
		}
		expect([io.stdout.text, io.stderr.text, error.message, error.stdout, error.stderr].join('\n')).not.toContain(secret)
		expect(io.stderr.lines[0]).toBe('$ install dependencies')
	})

	test('does not hang when a child closes before consuming a large stdin stream', async () => {
		const io = createTestOutput()
		const runner = new CommandRunner(io.output)
		const stdin = Readable.from(largeInput())

		const { output } = runner.runCommand(process.execPath, ['-e', 'process.exit(0)'], { cwd: process.cwd(), stdin })

		expect(await output).toBe('')
	})

	test('preserves source stdin failures', async () => {
		const io = createTestOutput()
		io.output.setMode('json')
		const runner = new CommandRunner(io.output)
		const sourceError = Object.assign(new Error('stdin source failed'), { code: 'EIO' })
		const stdin = new Readable({
			read() {
				this.destroy(sourceError)
			},
		})

		const { output } = runner.runCommand(process.execPath, ['-e', 'process.stdin.resume(); setTimeout(() => {}, 10000)'], {
			cwd: process.cwd(),
			stdin,
		})

		await expect(output).rejects.toBe(sourceError)
		expect(io.stdout.text).toBe('')
		expect(io.stderr.text).toBe('')
	})

	test('returns a typed failure when the child cannot start', async () => {
		const io = createTestOutput()
		io.output.setMode('quiet')
		const runner = new CommandRunner(io.output)

		const { output } = runner.runCommand('contember-command-that-does-not-exist', [], { cwd: process.cwd() })
		const error = await output.then(() => null, (reason: unknown) => reason)

		if (!(error instanceof ChildProcessError)) {
			throw new Error('Expected ChildProcessError')
		}
		expect(error.exitCode).toBeNull()
		expect(error.stdout).toBe('')
		expect(error.stderr).toBe('')
		expect(error.message).toBe('Command could not be started.')
		expect(error.cause).toBeInstanceOf(Error)
		expect(error.cause?.message).toContain('contember-command-that-does-not-exist')
		expect(error.signal).toBeNull()
		expect(io.stdout.text).toBe('')
		expect(io.stderr.text).toBe('')
	})

	test('distinguishes signal termination from spawn and exit-code failures', async () => {
		const io = createTestOutput()
		io.output.setMode('quiet')
		const runner = new CommandRunner(io.output)

		const { output } = runner.runCommand(process.execPath, ['-e', `process.kill(process.pid, 'SIGTERM')`], { cwd: process.cwd() })
		const error = await output.then(() => null, (reason: unknown) => reason)

		if (!(error instanceof ChildProcessError)) {
			throw new Error('Expected ChildProcessError')
		}
		expect(error.exitCode).toBeNull()
		expect(error.signal).toBe('SIGTERM')
		expect(error.cause).toBeUndefined()
		expect(error.message).toBe('Command terminated by signal SIGTERM.')
	})
})

const collectingWritable = (chunks: string[]): Writable =>
	new Writable({
		write(chunk: Buffer, _encoding, callback) {
			chunks.push(chunk.toString())
			callback()
		},
	})

function* largeInput(): Generator<Buffer> {
	for (let index = 0; index < 1024; index++) {
		yield Buffer.alloc(64 * 1024, 'x')
	}
}
