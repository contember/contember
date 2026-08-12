import { describe, expect, test } from 'bun:test'
import {
	CliError,
	Command,
	CommandConfiguration,
	CommandFactoryList,
	CommandManager,
	ExitCode,
	Input,
	InvalidConfigurationError,
	Output,
} from '../../../src/index.js'

class NoopCommand extends Command<{}, {}> {
	constructor(private readonly commandDescription: string = '') {
		super()
	}

	protected configure(configuration: CommandConfiguration<{}, {}>): void {
		configuration.description(this.commandDescription)
	}

	protected async execute(input: Input<{}, {}>, output: Output): Promise<void> {
	}
}

const createManager = (names: string[][]): CommandManager => {
	const commands: CommandFactoryList = {}
	for (const [canonical, ...aliases] of names) {
		const factory = () => new NoopCommand(`description of ${canonical}`)
		commands[canonical] = factory
		for (const alias of aliases) {
			commands[alias] = factory
		}
	}
	return new CommandManager(commands)
}

const defaultManager = () =>
	createManager([
		['deploy'],
		['version'],
		['data export', 'data:export'],
		['data import', 'data:import'],
		['migrations diff', 'migrations:diff'],
		['migrations describe', 'migrations:describe'],
		['migrations execute', 'migrations:execute'],
		['workspace update api', 'workspace:update:api'],
		['tenant apply', 'tenant:apply'],
	])

const resolveCommand = (manager: CommandManager, args: string[]) => {
	const resolution = manager.resolve(args)
	if (resolution.type !== 'command') {
		throw new Error(`expected a command, got a ${resolution.type}`)
	}
	return { name: resolution.entry.name, args: resolution.args }
}

describe('resolution', () => {
	test('resolves a single token command', () => {
		expect(resolveCommand(defaultManager(), ['deploy'])).toStrictEqual({ name: 'deploy', args: [] })
	})

	test('resolves the space separated form', () => {
		expect(resolveCommand(defaultManager(), ['migrations', 'diff'])).toStrictEqual({ name: 'migrations diff', args: [] })
	})

	test('resolves the colon separated form', () => {
		expect(resolveCommand(defaultManager(), ['migrations:diff'])).toStrictEqual({ name: 'migrations diff', args: [] })
	})

	test('resolves a mixed form', () => {
		expect(resolveCommand(defaultManager(), ['workspace:update', 'api'])).toStrictEqual({ name: 'workspace update api', args: [] })
	})

	test('the longest prefix wins and the rest becomes arguments', () => {
		expect(resolveCommand(defaultManager(), ['migrations', 'diff', 'my-migration', '--execute'])).toStrictEqual({
			name: 'migrations diff',
			args: ['my-migration', '--execute'],
		})
	})

	test('an argument is never split into command tokens', () => {
		expect(resolveCommand(defaultManager(), ['data:export', 'contember://token@localhost/app'])).toStrictEqual({
			name: 'data export',
			args: ['contember://token@localhost/app'],
		})
	})

	test('a leading option stops the command lookup', () => {
		expect(resolveCommand(defaultManager(), ['deploy', '--admin', 'admin'])).toStrictEqual({ name: 'deploy', args: ['--admin', 'admin'] })
	})

	test('an unknown command is reported', () => {
		expect(() => defaultManager().resolve(['nonsense'])).toThrow(CliError)
		try {
			defaultManager().resolve(['nonsense'])
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('COMMAND_NOT_FOUND')
				expect(e.exitCode).toBe(ExitCode.InputError)
			}
		}
	})

	test('an unknown verb of a known group is reported with the group listing', () => {
		try {
			defaultManager().resolve(['migrations', 'nonsense'])
			throw new Error('should have thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('COMMAND_NOT_FOUND')
				expect(e.message).toContain('migrations diff')
			}
		}
	})

	test('a group with a single command does not swallow an unknown verb', () => {
		expect(() => defaultManager().resolve(['tenant', 'nonsense'])).toThrow(CliError)
	})
})

describe('aliases', () => {
	test('the first registered name is canonical, the rest are aliases', () => {
		const entry = defaultManager().getCommands().find(it => it.name === 'data export')
		expect(entry?.aliases).toStrictEqual(['data:export'])
	})

	test('an alias is silent', () => {
		const warnings: unknown[] = []
		const originalWarn = console.warn
		console.warn = (...args: unknown[]) => warnings.push(args)
		try {
			resolveCommand(defaultManager(), ['migrations:diff'])
			defaultManager().createCommand('migrations:diff')
		} finally {
			console.warn = originalWarn
		}
		expect(warnings).toStrictEqual([])
	})

	test('a command is listed only once', () => {
		expect(defaultManager().getCommands().map(it => it.name)).toStrictEqual([
			'data export',
			'data import',
			'deploy',
			'migrations describe',
			'migrations diff',
			'migrations execute',
			'tenant apply',
			'version',
			'workspace update api',
		])
	})
})

describe('shorthand', () => {
	test('resolves an abbreviated colon form', () => {
		expect(resolveCommand(defaultManager(), ['m:di'])).toStrictEqual({ name: 'migrations diff', args: [] })
	})

	test('resolves migr:exe', () => {
		expect(resolveCommand(defaultManager(), ['migr:exe'])).toStrictEqual({ name: 'migrations execute', args: [] })
	})

	test('resolves an abbreviated space form', () => {
		expect(resolveCommand(defaultManager(), ['migr', 'exe'])).toStrictEqual({ name: 'migrations execute', args: [] })
	})

	test('resolves a partial prefix of a longer name', () => {
		expect(resolveCommand(defaultManager(), ['w:u'])).toStrictEqual({ name: 'workspace update api', args: [] })
	})

	test('keeps the remaining tokens as arguments', () => {
		expect(resolveCommand(defaultManager(), ['migr:diff', 'my-migration'])).toStrictEqual({ name: 'migrations diff', args: ['my-migration'] })
	})

	test('an ambiguous shorthand is reported', () => {
		try {
			defaultManager().resolve(['migrations:d'])
			throw new Error('should have thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('COMMAND_AMBIGUOUS')
				expect(e.exitCode).toBe(ExitCode.InputError)
				expect(e.message).toContain('migrations diff')
				expect(e.message).toContain('migrations describe')
			}
		}
	})
})

describe('groups', () => {
	test('a bare group token resolves to a group', () => {
		const resolution = defaultManager().resolve(['migrations'])
		expect(resolution.type).toBe('group')
		if (resolution.type === 'group') {
			expect(resolution.name).toBe('migrations')
			expect(resolution.entries.map(it => it.name).sort()).toStrictEqual(['migrations describe', 'migrations diff', 'migrations execute'])
		}
	})

	test('an intermediate group token resolves to a group', () => {
		const resolution = defaultManager().resolve(['workspace', 'update'])
		expect(resolution.type).toBe('group')
		if (resolution.type === 'group') {
			expect(resolution.entries.map(it => it.name)).toStrictEqual(['workspace update api'])
		}
	})

	test('a group followed by an option still resolves to a group', () => {
		expect(defaultManager().resolve(['tenant', '--help']).type).toBe('group')
	})
})

describe('prefix collision invariant', () => {
	test('rejects a command name that is a prefix of another one', () => {
		expect(() => createManager([['migrations'], ['migrations diff']])).toThrow(InvalidConfigurationError)
	})

	test('rejects a colon alias that is a prefix of another command', () => {
		expect(() => createManager([['tenant apply'], ['other', 'tenant']])).toThrow(InvalidConfigurationError)
	})

	test('accepts names that only share a prefix', () => {
		expect(() => createManager([['migrations diff'], ['migrations describe']])).not.toThrow()
	})

	test('accepts a name that is a substring but not a token prefix', () => {
		expect(() => createManager([['deploy'], ['deploy-admin']])).not.toThrow()
	})
})

describe('createCommand', () => {
	test('returns the canonical name', () => {
		const [name, command] = defaultManager().createCommand('migrations:diff')
		expect(name).toBe('migrations diff')
		expect(command).toBeInstanceOf(NoopCommand)
	})

	test('throws on a group', () => {
		expect(() => defaultManager().createCommand('migrations')).toThrow(CliError)
	})
})
