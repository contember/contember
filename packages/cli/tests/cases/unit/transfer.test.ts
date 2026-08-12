import { afterEach, describe, expect, test } from 'bun:test'
import { CliError, ExitCode, Input } from '@contember/cli-common'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import { ExportCommand } from '../../../src/commands/transfer/ExportCommand.js'
import { ImportCommand } from '../../../src/commands/transfer/ImportCommand.js'
import { TransferCommand } from '../../../src/commands/transfer/TransferCommand.js'
import { createProgressReporter } from '../../../src/lib/transfer/stdio.js'
import { RemoteProjectResolver } from '../../../src/lib/project/RemoteProjectResolver.js'
import { DataTransferClient } from '../../../src/lib/transfer/DataTransferClient.js'
import { CliEnv } from '../../../src/lib/env.js'
import { maskToken } from '../../../src/lib/maskToken.js'
import { Readable } from 'node:stream'
import { RemoteProject } from '../../../src/lib/project/RemoteProject.js'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtemp, rm } from 'node:fs/promises'

const cliEnv = (overrides: Partial<CliEnv> = {}): CliEnv => ({
	apiUrl: 'https://api.example.test',
	apiToken: 'test-token-1234',
	projectName: 'blog',
	...overrides,
})

const noProjectResolver = () => new RemoteProjectResolver(cliEnv({ apiUrl: undefined, apiToken: undefined, projectName: undefined }))
const originalFetch = globalThis.fetch
const transferHttpCases: ReadonlyArray<readonly [number, string, ExitCode]> = [
	[401, 'TRANSFER_EXPORT_UNAUTHORIZED', ExitCode.Forbidden],
	[403, 'TRANSFER_EXPORT_FORBIDDEN', ExitCode.Forbidden],
	[404, 'TRANSFER_EXPORT_NOT_FOUND', ExitCode.NotFound],
	[409, 'TRANSFER_EXPORT_CONFLICT', ExitCode.Conflict],
	[408, 'TRANSFER_EXPORT_TIMEOUT', ExitCode.Transient],
	[425, 'TRANSFER_EXPORT_TOO_EARLY', ExitCode.Transient],
	[429, 'TRANSFER_EXPORT_RATE_LIMITED', ExitCode.Transient],
	[503, 'TRANSFER_EXPORT_SERVER_ERROR', ExitCode.Transient],
	[422, 'TRANSFER_EXPORT_BAD_REQUEST', ExitCode.InputError],
]
const structuredOutputModes: ReadonlyArray<'json' | 'quiet'> = ['json', 'quiet']

const withTimeout = async <T>(promise: Promise<T>, milliseconds = 500): Promise<T> => {
	let timer: ReturnType<typeof setTimeout> | undefined
	const timeout = new Promise<never>((_resolve, reject) => {
		timer = setTimeout(() => reject(new Error('Test operation timed out')), milliseconds)
	})
	try {
		return await Promise.race([promise, timeout])
	} finally {
		if (timer !== undefined) {
			clearTimeout(timer)
		}
	}
}

afterEach(() => {
	globalThis.fetch = originalFetch
})

/** A DataTransferClient double that fails the test if any network method is actually invoked. */
class FailingDataTransferClient extends DataTransferClient {
	public readonly calls: string[] = []
	public dataImport: DataTransferClient['dataImport'] = async () => {
		this.calls.push('dataImport')
		throw new Error('dataImport must not be called')
	}
	public dataExport: DataTransferClient['dataExport'] = async () => {
		this.calls.push('dataExport')
		throw new Error('dataExport must not be called')
	}
}

class SuccessfulDataTransferClient extends DataTransferClient {
	public dataImportCalls = 0
	public override dataImport: DataTransferClient['dataImport'] = async () => {
		this.dataImportCalls++
	}
	public override dataExport: DataTransferClient['dataExport'] = async () => new Response('["insertEnd"]\n')
}

describe('createProgressReporter', () => {
	test('writes progress to stderr only when stderr is a human TTY', () => {
		const { output, stderr } = createTestOutput({ stderrTty: true })
		createProgressReporter(output)('transferred 1 MiB')
		expect(stderr.text).toContain('transferred 1 MiB')
	})

	test('is silent when stderr is not a TTY', () => {
		const { output, stderr } = createTestOutput({ stderrTty: false })
		createProgressReporter(output)('transferred 1 MiB')
		expect(stderr.text).toBe('')
	})
})

describe('data export', () => {
	test('a missing project is reported as a NotFound CliError', async () => {
		const { output } = createTestOutput()
		const command = new ExportCommand(noProjectResolver(), new FailingDataTransferClient())
		try {
			await command.execute(new Input({}, {}), output)
			throw new Error('should have thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('PROJECT_NOT_DEFINED')
				expect(e.exitCode).toBe(ExitCode.NotFound)
			}
		}
	})
})

describe('maskToken', () => {
	test('keeps a small fingerprint for recognizable tokens', () => {
		expect(maskToken('ABCDEFGHIJKLMNOPQRSTUVWXYZ012345')).toBe('ABC***345')
	})

	test.each(['', 'short', 'token with spaces', 'abc\u001b[31msecret', 'pässword-secret'])(
		'hides an unexpected token format completely',
		token => {
			expect(maskToken(token)).toBe('***')
			expect(maskToken(token)).not.toContain(token || 'distinctive-secret')
		},
	)
})

describe('DataTransferClient transport errors', () => {
	test.each(transferHttpCases)('classifies HTTP %i without leaking the response body', async (status, code, exitCode) => {
		const secret = `distinctive-response-${status}`
		globalThis.fetch = async () =>
			new Response(secret, {
				status,
				headers: { 'retry-after': status === 429 ? '30' : secret },
			})
		const client = new DataTransferClient()
		const promise = client.dataExport({
			project: new RemoteProject('blog', 'https://api.example.test', 'distinctive-token-value'),
			includeSystem: false,
			gzip: false,
		})

		await expect(promise).rejects.toMatchObject({ code, exitCode })
		try {
			await promise
		} catch (error) {
			expect(JSON.stringify(error)).not.toContain(secret)
			expect(JSON.stringify(error)).not.toContain('distinctive-token-value')
		}
	})

	test('propagates an import source failure as one typed stream error', async () => {
		globalThis.fetch = async (_input, init) =>
			await new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener('abort', () => reject(new Error('request aborted')))
			})
		const source = new Readable({
			read() {
				this.destroy(new Error('distinctive-source-secret'))
			},
		})
		const client = new DataTransferClient()

		const promise = client.dataImport({
			stream: source,
			project: new RemoteProject('blog', 'https://api.example.test', 'distinctive-token-value'),
			printProgress: () => undefined,
			gzip: false,
		})

		await expect(promise).rejects.toMatchObject({
			code: 'TRANSFER_IMPORT_STREAM_FAILED',
			exitCode: ExitCode.InputError,
		})
		try {
			await promise
		} catch (error) {
			expect(JSON.stringify(error)).not.toContain('distinctive-source-secret')
			expect(JSON.stringify(error)).not.toContain('distinctive-token-value')
		}
	})

	test('propagates a transform failure as one typed stream error', async () => {
		globalThis.fetch = async (_input, init) =>
			await new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener('abort', () => reject(new Error('request aborted')))
			})
		const client = new DataTransferClient()

		const promise = client.dataImport({
			stream: Readable.from(['distinctive-invalid-transfer-line\n']),
			project: new RemoteProject('blog', 'https://api.example.test', 'distinctive-token-value'),
			printProgress: () => undefined,
			gzip: false,
		})

		await expect(promise).rejects.toMatchObject({ code: 'TRANSFER_IMPORT_STREAM_FAILED' })
		try {
			await promise
		} catch (error) {
			expect(JSON.stringify(error)).not.toContain('distinctive-invalid-transfer-line')
		}
	})

	test('rejects an unknown NDJSON command with a safe typed error', async () => {
		globalThis.fetch = async (_input, init) =>
			await new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener('abort', () => reject(new Error('request aborted')))
			})
		const command = 'distinctiveUnknownCommand'
		const client = new DataTransferClient()
		const promise = client.dataImport({
			stream: Readable.from([JSON.stringify([command, { distinctive: 'line-secret' }]) + '\n']),
			project: new RemoteProject('blog', 'https://api.example.test', 'distinctive-token-value'),
			printProgress: () => undefined,
			gzip: false,
		})

		await expect(withTimeout(promise)).rejects.toMatchObject({
			code: 'TRANSFER_IMPORT_UNKNOWN_COMMAND',
			exitCode: ExitCode.InputError,
		})
		try {
			await promise
		} catch (error) {
			const serialized = JSON.stringify(error)
			expect(serialized).not.toContain(command)
			expect(serialized).not.toContain('line-secret')
		}
	})

	test('classifies an upload destination failure without hanging', async () => {
		globalThis.fetch = async () => {
			throw new Error('distinctive-destination-secret')
		}
		const client = new DataTransferClient()
		const promise = client.dataImport({
			stream: Readable.from(['["insertEnd"]\n']),
			project: new RemoteProject('blog', 'https://api.example.test', 'distinctive-token-value'),
			printProgress: () => undefined,
			gzip: false,
		})

		await expect(promise).rejects.toMatchObject({
			code: 'TRANSFER_IMPORT_UNREACHABLE',
			exitCode: ExitCode.Transient,
		})
	})

	test('stops a large upload when the server rejects it before consuming the body', async () => {
		globalThis.fetch = async () => new Response('distinctive-early-response', { status: 401 })
		const source = Readable.from((async function*() {
			for (let index = 0; index < 100; index++) {
				yield Buffer.alloc(64 * 1024, 1)
			}
		})())
		const client = new DataTransferClient()

		await expect(client.dataImport({
			stream: source,
			project: new RemoteProject('blog', 'https://api.example.test', 'distinctive-token-value'),
			printProgress: () => undefined,
			gzip: false,
		})).rejects.toMatchObject({
			code: 'TRANSFER_IMPORT_UNAUTHORIZED',
			exitCode: ExitCode.Forbidden,
		})
	})
})

describe('data import --dry-run', () => {
	test('performs no network call and exits successfully', async () => {
		const { output } = createTestOutput()
		const client = new FailingDataTransferClient()
		const command = new ImportCommand(new RemoteProjectResolver(cliEnv()), client)

		const code = await command.execute(new Input({ file: 'export.jsonl' }, { yes: false, 'dry-run': true }), output)

		expect(code).toBe(ExitCode.Success)
		expect(client.calls).toEqual([])
	})

	test('never prompts, even without --yes and without a TTY', async () => {
		const { output } = createTestOutput({ stdinTty: false })
		const client = new FailingDataTransferClient()
		const command = new ImportCommand(new RemoteProjectResolver(cliEnv()), client)

		// would hang/throw TTY_UNAVAILABLE on the real path — dry-run must short-circuit before that guard
		const code = await command.execute(new Input({ file: 'export.jsonl' }, { yes: false, 'dry-run': true }), output)

		expect(code).toBe(ExitCode.Success)
	})

	test('prints a structured preview on stdout and nothing on stderr', async () => {
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('json')
		const command = new ImportCommand(new RemoteProjectResolver(cliEnv()), new FailingDataTransferClient())

		await command.execute(new Input({ file: 'export.jsonl' }, { yes: false, 'dry-run': true }), output)

		const preview = JSON.parse(stdout.text)
		expect(preview).toMatchObject({
			dryRun: true,
			source: 'export.jsonl',
			target: { project: 'blog', endpoint: 'https://api.example.test' },
			wipesTarget: true,
		})
		expect(stderr.text).toBe('')
	})

	test('never prints a malformed credential in human output', async () => {
		const token = 'distinctive token with spaces'
		const { output, stdout, stderr } = createTestOutput()
		const command = new ImportCommand(
			new RemoteProjectResolver(cliEnv({ apiToken: token })),
			new FailingDataTransferClient(),
		)

		await command.execute(new Input({ file: 'export.jsonl' }, { yes: false, 'dry-run': true }), output)

		expect(stdout.text).toContain('Token: ***')
		expect(stdout.text).not.toContain(token)
		expect(stderr.text).toBe('')
	})

	test('escapes file, project, and endpoint control characters in human output', async () => {
		const { output, stdout } = createTestOutput()
		const command = new ImportCommand(
			new RemoteProjectResolver(cliEnv({
				apiUrl: 'https://api.example.test/\u001b[31m',
				projectName: 'blog\u0007project',
			})),
			new FailingDataTransferClient(),
		)

		await command.execute(
			new Input(
				{ file: 'export\u001b[32m\u0007.jsonl' },
				{ yes: false, 'dry-run': true },
			),
			output,
		)

		expect(stdout.text).not.toContain('\u001b')
		expect(stdout.text).not.toContain('\u0007')
		expect(stdout.text).toContain('Source file: export[32m.jsonl')
		expect(stdout.text).toContain('Project name: blogproject')
	})

	test('a missing target project is reported as a NotFound CliError, not a network call', async () => {
		const { output } = createTestOutput()
		const client = new FailingDataTransferClient()
		const command = new ImportCommand(noProjectResolver(), client)
		try {
			await command.execute(new Input({ file: 'export.jsonl' }, { yes: false }), output)
			throw new Error('should have thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('PROJECT_NOT_DEFINED')
				expect(e.exitCode).toBe(ExitCode.NotFound)
			}
		}
		expect(client.calls).toEqual([])
	})
})

describe('data import confirmation guard', () => {
	test('refuses to prompt outside a TTY instead of hanging, without touching the network', async () => {
		const { output } = createTestOutput({ stdinTty: false })
		const client = new FailingDataTransferClient()
		const command = new ImportCommand(new RemoteProjectResolver(cliEnv()), client)

		try {
			await command.execute(new Input({ file: 'export.jsonl' }, { yes: false }), output)
			throw new Error('should have thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('TTY_UNAVAILABLE')
				expect(e.exitCode).toBe(ExitCode.InputError)
			}
		}
		expect(client.calls).toEqual([])
	})
})

describe('data import output', () => {
	test('emits one structured result in JSON mode and a project scalar in quiet mode', async () => {
		for (const mode of structuredOutputModes) {
			const { output, stdout, stderr } = createTestOutput()
			output.setMode(mode)
			const client = new SuccessfulDataTransferClient()
			const command = new ImportCommand(new RemoteProjectResolver(cliEnv()), client)

			await command.execute(new Input({ file: '/dev/null' }, { yes: true }), output)

			if (mode === 'json') {
				expect(JSON.parse(stdout.text)).toEqual({
					source: '/dev/null',
					target: { project: 'blog', endpoint: 'https://api.example.test' },
					imported: true,
				})
			} else {
				expect(stdout.text).toBe('blog\n')
			}
			expect(stderr.text).toBe('')
			expect(client.dataImportCalls).toBe(1)
		}
	})

	test('awaits gzip upstream failure and returns a typed error', async () => {
		globalThis.fetch = async (_input, init) =>
			await new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener('abort', () => reject(new Error('request aborted')))
			})
		const source = new Readable({
			read() {
				this.destroy(new Error('distinctive-gzip-source-secret'))
			},
		})
		const { output } = createTestOutput()
		const command = new ImportCommand(
			new RemoteProjectResolver(cliEnv()),
			new DataTransferClient(),
			() => source,
		)

		const promise = command.execute(new Input({ file: 'export.jsonl.gz' }, { yes: true }), output)

		await expect(withTimeout(promise)).rejects.toMatchObject({ code: 'TRANSFER_IMPORT_STREAM_FAILED' })
		expect(source.destroyed).toBe(true)
	})

	test('closes a blocked gzip source when the import target rejects early', async () => {
		class RejectingImportClient extends DataTransferClient {
			public override dataImport: DataTransferClient['dataImport'] = async () => {
				throw new CliError('Import rejected', {
					code: 'TRANSFER_IMPORT_UNAUTHORIZED',
					exitCode: ExitCode.Forbidden,
				})
			}
		}
		const source = new Readable({ read() {} })
		const { output } = createTestOutput()
		const command = new ImportCommand(
			new RemoteProjectResolver(cliEnv()),
			new RejectingImportClient(),
			() => source,
		)

		const promise = command.execute(new Input({ file: 'export.jsonl.gz' }, { yes: true }), output)

		await expect(withTimeout(promise)).rejects.toMatchObject({
			code: 'TRANSFER_IMPORT_UNAUTHORIZED',
			exitCode: ExitCode.Forbidden,
		})
		expect(source.destroyed).toBe(true)
	})
})

describe('data transfer --dry-run', () => {
	test('performs no network call and exits successfully', async () => {
		const { output } = createTestOutput()
		const client = new FailingDataTransferClient()
		const command = new TransferCommand(new RemoteProjectResolver(cliEnv()), client)

		const code = await command.execute(
			new Input({ source: 'source-project', target: 'target-project' }, { yes: false, 'dry-run': true }),
			output,
		)

		expect(code).toBe(ExitCode.Success)
		expect(client.calls).toEqual([])
	})

	test('prints source and target with wipesTarget true', async () => {
		const { output, stdout } = createTestOutput()
		output.setMode('json')
		const command = new TransferCommand(new RemoteProjectResolver(cliEnv()), new FailingDataTransferClient())

		await command.execute(
			new Input({ source: 'source-project', target: 'target-project' }, { yes: false, 'dry-run': true }),
			output,
		)

		const preview = JSON.parse(stdout.text)
		expect(preview).toMatchObject({
			dryRun: true,
			source: { project: 'source-project' },
			target: { project: 'target-project' },
			wipesTarget: true,
		})
	})
})

describe('data transfer self-target guard', () => {
	test.each([
		['blog', 'blog'],
		['blog', '.'],
		[
			'contember://blog:source-token@API.EXAMPLE.TEST:443',
			'contember://blog:target-token@api.example.test',
		],
	])('rejects identical or equivalent %s and %s before network access', async (source, target) => {
		const { output } = createTestOutput()
		const client = new FailingDataTransferClient()
		const command = new TransferCommand(new RemoteProjectResolver(cliEnv()), client)
		const promise = command.execute(new Input({ source, target }, { yes: true }), output)

		await expect(promise).rejects.toMatchObject({
			code: 'TRANSFER_SOURCE_EQUALS_TARGET',
			exitCode: ExitCode.InputError,
		})
		expect(client.calls).toEqual([])
	})
})

describe('data transfer output', () => {
	test('emits one structured result in JSON mode and never includes either token', async () => {
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('json')
		const client = new SuccessfulDataTransferClient()
		const command = new TransferCommand(new RemoteProjectResolver(cliEnv()), client)

		await command.execute(
			new Input(
				{ source: 'source-project', target: 'target-project' },
				{ yes: true },
			),
			output,
		)

		expect(JSON.parse(stdout.text)).toEqual({
			source: { project: 'source-project', endpoint: 'https://api.example.test' },
			target: { project: 'target-project', endpoint: 'https://api.example.test' },
			transferred: true,
		})
		expect(stdout.text).not.toContain('test-token-1234')
		expect(stderr.text).toBe('')
		expect(client.dataImportCalls).toBe(1)
	})

	test('cancels a blocked web export stream after an early import rejection', async () => {
		let cancelled = false
		class BlockedExportClient extends DataTransferClient {
			public override dataExport: DataTransferClient['dataExport'] = async () => ({
				body: new ReadableStream<Uint8Array>({
					pull: () => new Promise<void>(() => undefined),
					cancel() {
						cancelled = true
					},
				}),
			})
		}
		globalThis.fetch = async () => new Response('rejected', { status: 401 })
		const { output } = createTestOutput()
		output.setMode('json')
		const command = new TransferCommand(new RemoteProjectResolver(cliEnv()), new BlockedExportClient())

		const promise = command.execute(
			new Input(
				{ source: 'source-project', target: 'target-project' },
				{ yes: true, 'no-gzip-transfer': true },
			),
			output,
		)

		await expect(withTimeout(promise)).rejects.toMatchObject({ code: 'TRANSFER_IMPORT_UNAUTHORIZED' })
		expect(cancelled).toBe(true)
	})

	test('prints the target project only in quiet mode', async () => {
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('quiet')
		const command = new TransferCommand(new RemoteProjectResolver(cliEnv()), new SuccessfulDataTransferClient())

		await command.execute(
			new Input(
				{ source: 'source-project', target: 'target-project' },
				{ yes: true },
			),
			output,
		)

		expect(stdout.text).toBe('target-project\n')
		expect(stderr.text).toBe('')
	})
})

describe('data export stream failures', () => {
	test('propagates a response stream failure as a typed error without writing JSON data', async () => {
		class BrokenExportClient extends DataTransferClient {
			public override dataExport: DataTransferClient['dataExport'] = async () => ({
				body: new Readable({
					read() {
						this.push(Buffer.from('partial export'))
						this.destroy(new Error('distinctive-export-source-secret'))
					},
				}),
			})
		}
		const { output, stdout } = createTestOutput()
		output.setMode('json')
		const command = new ExportCommand(new RemoteProjectResolver(cliEnv()), new BrokenExportClient())
		const promise = command.execute(new Input({}, { output: '/dev/null', 'no-gzip-output': true }), output)

		await expect(promise).rejects.toMatchObject({ code: 'TRANSFER_EXPORT_STREAM_FAILED' })
		expect(stdout.text).toBe('')
	})

	test('propagates a destination write failure as a typed error', async () => {
		class SuccessfulExportClient extends DataTransferClient {
			public override dataExport: DataTransferClient['dataExport'] = async () => new Response('exported data')
		}
		const { output } = createTestOutput()
		const command = new ExportCommand(new RemoteProjectResolver(cliEnv()), new SuccessfulExportClient())

		await expect(command.execute(
			new Input({}, { output: '/dev/full', 'no-gzip-output': true }),
			output,
		)).rejects.toMatchObject({ code: 'TRANSFER_EXPORT_STREAM_FAILED' })
	})
})

describe('data export output', () => {
	test('emits one structured result in JSON mode', async () => {
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('json')
		const command = new ExportCommand(new RemoteProjectResolver(cliEnv()), new SuccessfulDataTransferClient())

		await command.execute(new Input({}, { output: '/dev/null', 'no-gzip-output': true }), output)

		expect(JSON.parse(stdout.text)).toEqual({
			project: 'blog',
			endpoint: 'https://api.example.test',
			file: '/dev/null',
			exported: true,
		})
		expect(stderr.text).toBe('')
	})

	test('escapes control characters in the human output file path', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'contember-transfer-test-'))
		const file = join(directory, 'export\u001b[31m\u0007.jsonl')
		try {
			const { output, stdout } = createTestOutput()
			const command = new ExportCommand(new RemoteProjectResolver(cliEnv()), new SuccessfulDataTransferClient())

			await command.execute(new Input({}, { output: file, 'no-gzip-output': true }), output)

			expect(stdout.text).not.toContain('\u001b')
			expect(stdout.text).not.toContain('\u0007')
			expect(stdout.text).toContain('export[31m.jsonl')
		} finally {
			await rm(directory, { recursive: true })
		}
	})
})

describe('data transfer confirmation guard', () => {
	test('refuses to prompt outside a TTY instead of hanging, without touching the network', async () => {
		const { output } = createTestOutput({ stdinTty: false })
		const client = new FailingDataTransferClient()
		const command = new TransferCommand(new RemoteProjectResolver(cliEnv()), client)

		try {
			await command.execute(new Input({ source: 'source-project', target: 'target-project' }, { yes: false }), output)
			throw new Error('should have thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('TTY_UNAVAILABLE')
			}
		}
		expect(client.calls).toEqual([])
	})
})
