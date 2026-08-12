import { beforeAll, describe, expect, spyOn, test } from 'bun:test'
import chalk from 'chalk'
import {
	Application,
	CliError,
	Command,
	CommandConfiguration,
	CommandFactoryList,
	CommandManager,
	ExitCode,
	exitProcess,
	Input,
	InvalidConfigurationError,
	Output,
	readGlobalOptionsFromArgs,
	renderCliError,
} from '../../../src/index.js'
import { createTestOutput, TestOutput } from '../../lib/testOutput.js'

beforeAll(() => {
	chalk.level = 0
})

type PrintSchemaOptions = {
	format?: string
}

/** Mirrors `project print-schema`: an option taking a value, used to prove that no token is pre-stripped. */
class PrintSchemaCommand extends Command<{}, PrintSchemaOptions> {
	protected configure(configuration: CommandConfiguration<{}, PrintSchemaOptions>): void {
		configuration.description('Prints project schema')
		configuration.option('format').valueRequired()
	}

	protected async execute(input: Input<{}, PrintSchemaOptions>, output: Output): Promise<void> {
		output.data({ format: input.getOption('format') ?? null })
	}
}

class EchoCommand extends Command<{ value: string }, {}> {
	protected configure(configuration: CommandConfiguration<{ value: string }, {}>): void {
		configuration.description('Echoes the argument')
		configuration.argument('value')
	}

	protected async execute(input: Input<{ value: string }, {}>, output: Output): Promise<void> {
		output.data(input.getArgument('value'), it => it)
	}
}

class DiagnosticFailingCommand extends Command<{}, {}> {
	protected configure(configuration: CommandConfiguration<{}, {}>): void {
		configuration.description('Emits a diagnostic and fails')
	}

	protected async execute(input: Input<{}, {}>, output: Output): Promise<void> {
		output.info('request started')
		output.warn('request warning')
		throw new CliError('request failed', { code: 'FAILED', exitCode: ExitCode.Transient })
	}
}

type DeprecatedOptions = { old?: boolean }

class DeprecatedCommand extends Command<{}, DeprecatedOptions> {
	protected configure(configuration: CommandConfiguration<{}, DeprecatedOptions>): void {
		configuration.option('old').deprecated()
	}

	protected async execute(): Promise<void> {
	}
}

type ReservedOptions = { local?: boolean; json?: boolean }

class ReservedOptionCommand extends Command<{}, ReservedOptions> {
	constructor(private readonly collision: 'name' | 'shortcut') {
		super()
	}

	protected configure(configuration: CommandConfiguration<{}, ReservedOptions>): void {
		if (this.collision === 'name') {
			configuration.option('json')
		} else {
			configuration.option('local').shortcut('q')
		}
	}

	protected async execute(): Promise<void> {
	}
}

class FailingCommand extends Command<{}, {}> {
	constructor(private readonly error: unknown) {
		super()
	}

	protected configure(configuration: CommandConfiguration<{}, {}>): void {
		configuration.description('Always fails')
	}

	protected async execute(): Promise<void> {
		throw this.error
	}
}

class GroupCommand extends Command<{}, {}> {
	protected configure(configuration: CommandConfiguration<{}, {}>): void {
		configuration.description('Applies tenant configuration')
	}

	protected async execute(): Promise<void> {
	}
}

class RunOverridingCommand extends Command<{}, {}> {
	public readonly calls: string[][] = []

	protected configure(configuration: CommandConfiguration<{}, {}>): void {
		configuration.description('Uses the historical run hook')
	}

	public async run(args: string[]): Promise<number> {
		this.calls.push(args)
		return 23
	}

	protected async execute(): Promise<void> {
		throw new Error('Application must dispatch through the run override')
	}
}

const createApplication = (extra: CommandFactoryList = {}): { application: Application; test: TestOutput } => {
	const printSchema = () => new PrintSchemaCommand()
	const tenantApply = () => new GroupCommand()
	const workspaceUpdateApi = () => new GroupCommand()
	const commands: CommandFactoryList = {
		['project print-schema']: printSchema,
		['project:print-schema']: printSchema,
		['echo']: () => new EchoCommand(),
		['tenant apply']: tenantApply,
		['tenant:apply']: tenantApply,
		['workspace update api']: workspaceUpdateApi,
		['workspace:update:api']: workspaceUpdateApi,
		...extra,
	}
	const testOutput = createTestOutput()
	return {
		application: new Application(new CommandManager(commands), 'Test CLI', testOutput.output),
		test: testOutput,
	}
}

describe('public construction compatibility', () => {
	test('Application accepts the historical options-only form', async () => {
		const manager = new CommandManager({ ['noop']: () => new GroupCommand() })
		const calls: string[] = []
		const application = new Application(manager, 'Test CLI', {
			beforeRun: ({ name }) => {
				calls.push(name)
			},
		})

		expect(await application.execute(['noop'])).toBe(ExitCode.Success)
		expect(calls).toStrictEqual(['noop'])
	})

	test('Application accepts an Output followed by options', async () => {
		const io = createTestOutput()
		const manager = new CommandManager({ ['echo']: () => new EchoCommand() })
		const calls: string[] = []
		const application = new Application(manager, 'Test CLI', io.output, {
			beforeRun: ({ name }) => {
				calls.push(name)
			},
		})

		expect(await application.execute(['echo', 'hello'])).toBe(ExitCode.Success)
		expect(io.stdout.text).toBe('hello\n')
		expect(calls).toStrictEqual(['echo'])
	})

	test('Command.run creates its own Output when omitted', async () => {
		expect(await new GroupCommand().run([])).toBe(ExitCode.Success)
	})

	test('Application preserves a Command.run override', async () => {
		const command = new RunOverridingCommand()
		const io = createTestOutput()
		const application = new Application(new CommandManager({ ['legacy']: () => command }), 'Test CLI', io.output)

		expect(await application.execute(['legacy', 'raw-value'])).toBe(23)
		expect(command.calls).toStrictEqual([['raw-value']])
	})
})

describe('global options', () => {
	test('--json switches the output mode', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['echo', 'hello', '--json'])).toBe(ExitCode.Success)
		expect(io.stdout.text).toBe('"hello"\n')
	})

	test('--quiet switches the output mode', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['echo', 'hello', '--quiet'])).toBe(ExitCode.Success)
		expect(io.stdout.text).toBe('hello\n')
	})

	test('-q switches the output mode', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['echo', 'hello', '-q'])).toBe(ExitCode.Success)
		expect(io.output.mode).toBe('quiet')
	})

	test('a global option is not pre-stripped from argv', async () => {
		// --quiet must stay in place: it is not a value, so --format is still missing one
		const { application, test: io } = createApplication()
		expect(await application.execute(['project', 'print-schema', '--format', '--quiet', 'introspection'])).toBe(ExitCode.InputError)
		expect(io.stdout.text).toBe('')
		expect(io.stderr.text).toContain('Undefined value for option --format')
	})

	test('an unknown option is still rejected', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['echo', 'hello', '--nonsense'])).toBe(ExitCode.InputError)
		expect(io.stderr.text).toContain('Undefined option --nonsense')
	})

	test('command-local global names and shortcuts fail configuration', () => {
		expect(() => new ReservedOptionCommand('name').getConfiguration()).toThrow(InvalidConfigurationError)
		expect(() => new ReservedOptionCommand('shortcut').getConfiguration()).toThrow(InvalidConfigurationError)
	})
})

describe('help', () => {
	test('the application help lists the canonical names on stderr', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute([])).toBe(ExitCode.Success)
		expect(io.stdout.text).toBe('')
		expect(io.stderr.text).toContain('project print-schema')
		expect(io.stderr.text).toContain('Test CLI')
	})

	test('a group prints its commands and succeeds', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['tenant'])).toBe(ExitCode.Success)
		expect(io.stdout.text).toBe('')
		expect(io.stderr.text).toContain('tenant apply')
		expect(io.stderr.text).toContain('Applies tenant configuration')
	})

	test('a group with --help prints its commands and succeeds', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['tenant', '--help'])).toBe(ExitCode.Success)
		expect(io.stderr.text).toContain('tenant apply')
	})

	test('a group with -h prints its commands and succeeds', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['tenant', '-h'])).toBe(ExitCode.Success)
		expect(io.stderr.text).toContain('tenant apply')
	})

	for (const args of [['tenant', '--nonsense'], ['tenant', '--help=unexpected'], ['project', '--json']]) {
		test(`a group rejects trailing input: ${args.join(' ')}`, async () => {
			const { application, test: io } = createApplication()
			expect(await application.execute(args)).toBe(ExitCode.InputError)
			expect(io.stderr.text).not.toContain('Usage: tenant <command>')
			expect(io.stderr.text).toContain('INVALID_INPUT')
		})
	}

	test('an intermediate group rejects trailing input', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['workspace', 'update', '--execute'])).toBe(ExitCode.InputError)
		expect(io.stderr.text).not.toContain('Usage: workspace update <command>')
		expect(io.stderr.text).toContain('INVALID_INPUT')
	})

	test('a command help goes to stderr and lists the global options', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['echo', '--help'])).toBe(ExitCode.Success)
		expect(io.stdout.text).toBe('')
		expect(io.stderr.text).toContain('Echoes the argument')
		expect(io.stderr.text).toContain('--json')
	})

	test('a command help works even when a required argument is missing', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['echo', '-h'])).toBe(ExitCode.Success)
		expect(io.stderr.text).toContain('Echoes the argument')
	})
})

describe('errors', () => {
	test('bootstrap code can select JSON errors before Application construction', () => {
		const io = createTestOutput()
		io.output.applyGlobalOptions(readGlobalOptionsFromArgs(['--json']))
		expect(renderCliError(new Error('bootstrap failed'), io.output)).toBe(ExitCode.InternalError)
		expect(JSON.parse(io.stderr.text).error).toStrictEqual({
			code: 'UNKNOWN',
			message: 'An unexpected error occurred.',
			retryable: false,
			details: null,
		})
	})

	test('an unknown command exits with an input error', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['nonsense'])).toBe(ExitCode.InputError)
		expect(io.stdout.text).toBe('')
		expect(io.stderr.text).toContain('COMMAND_NOT_FOUND')
	})

	test('a missing argument prints the usage', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['echo'])).toBe(ExitCode.InputError)
		expect(io.stderr.text).toContain('Argument value is required')
		expect(io.stderr.text).toContain('<value>')
	})

	test('a legacy string throw is an input error', async () => {
		const { application, test: io } = createApplication({ ['fail']: () => new FailingCommand('Project not defined') })
		expect(await application.execute(['fail'])).toBe(ExitCode.InputError)
		expect(io.stderr.text).toContain('Project not defined')
	})

	test('an unexpected error is an internal error', async () => {
		const { application, test: io } = createApplication({ ['fail']: () => new FailingCommand(new Error('boom')) })
		expect(await application.execute(['fail'])).toBe(ExitCode.InternalError)
		expect(io.stderr.text).toContain('UNKNOWN')
		expect(io.stderr.text).toContain('boom')
	})

	test('a CliError keeps its exit code', async () => {
		const error = new CliError('nope', { code: 'FORBIDDEN', exitCode: ExitCode.Forbidden })
		const { application, test: io } = createApplication({ ['fail']: () => new FailingCommand(error) })
		expect(await application.execute(['fail'])).toBe(ExitCode.Forbidden)
		expect(io.stderr.text).toContain('FORBIDDEN')
	})

	test('--json renders the error envelope on stderr', async () => {
		const error = new CliError('nope', { code: 'PROJECT_NOT_DEFINED', exitCode: ExitCode.Transient, retryable: true })
		const { application, test: io } = createApplication({ ['fail']: () => new FailingCommand(error) })
		expect(await application.execute(['fail', '--json'])).toBe(ExitCode.Transient)
		expect(io.stdout.text).toBe('')
		expect(JSON.parse(io.stderr.text)).toStrictEqual({
			ok: false,
			error: { code: 'PROJECT_NOT_DEFINED', message: 'nope', retryable: true, details: null },
		})
	})

	test('--json renders a parse error as an envelope too', async () => {
		const { application, test: io } = createApplication()
		expect(await application.execute(['echo', '--json'])).toBe(ExitCode.InputError)
		expect(io.stdout.text).toBe('')
		expect(JSON.parse(io.stderr.text).error.code).toBe('INVALID_INPUT')
	})

	test('--json suppresses diagnostics before a failure envelope', async () => {
		const { application, test: io } = createApplication({ ['diagnostic-fail']: () => new DiagnosticFailingCommand() })
		expect(await application.execute(['diagnostic-fail', '--json'])).toBe(ExitCode.Transient)
		expect(io.stdout.text).toBe('')
		expect(JSON.parse(io.stderr.text).error).toMatchObject({ code: 'FAILED', message: 'request failed' })
	})

	test('a fatal error is visible even in quiet mode', async () => {
		const { application, test: io } = createApplication({ ['fail']: () => new FailingCommand('broken') })
		expect(await application.execute(['fail', '--quiet'])).toBe(ExitCode.InputError)
		expect(io.stderr.text).toContain('broken')
	})
})

describe('parser diagnostics', () => {
	test('Application routes deprecated options through human Output', async () => {
		const { application, test: io } = createApplication({ ['deprecated']: () => new DeprecatedCommand() })
		expect(await application.execute(['deprecated', '--old'])).toBe(ExitCode.Success)
		expect(io.stderr.lines).toStrictEqual(['Option --old is deprecated.'])
	})

	test('Command.run routes deprecated options after applying the final mode', async () => {
		const human = createTestOutput()
		await new DeprecatedCommand().run(['--old'], human.output)
		expect(human.stderr.lines).toStrictEqual(['Option --old is deprecated.'])

		const json = createTestOutput()
		await new DeprecatedCommand().run(['--old', '--json'], json.output)
		expect(json.stderr.text).toBe('')
	})
})

describe('exitProcess', () => {
	test('sets exitCode without scheduling a forced exit', () => {
		const setTimeoutSpy = spyOn(globalThis, 'setTimeout')
		const originalExitCode = process.exitCode
		try {
			exitProcess(23)
			expect(process.exitCode).toBe(23)
			expect(setTimeoutSpy).not.toHaveBeenCalled()
		} finally {
			process.exitCode = originalExitCode ?? ExitCode.Success
			setTimeoutSpy.mockRestore()
		}
	})
})

describe('runCommand', () => {
	test('runs a named command without the application level help', async () => {
		const { application, test: io } = createApplication()
		expect(await application.executeCommand('echo', ['hello'])).toBe(ExitCode.Success)
		expect(io.stdout.text).toBe('hello\n')
	})

	test('runCommandInternal remains callable and applies exit semantics', async () => {
		const { application, test: io } = createApplication()
		const originalExitCode = process.exitCode
		try {
			await application.runCommandInternal('echo', ['hello'], false)
			expect(process.exitCode).toBe(ExitCode.Success)
			expect(io.stdout.text).toBe('hello\n')
		} finally {
			process.exitCode = originalExitCode
		}
	})
})
