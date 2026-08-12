import chalk from 'chalk'
import { CommandCatalogEntry, CommandFactory, CommandManager } from './CommandManager.js'
import { Command } from './Command.js'
import { InvalidInputError } from './InputParser.js'
import { Output } from './Output.js'
import { ExitCode } from './CliError.js'
import { renderCliError } from './ErrorRenderer.js'
import { exitProcess } from './exitProcess.js'
import { globalOptions, hasHelpFlag, readGlobalOptionsFromArgs } from './GlobalOptions.js'
import { UsageFormatter } from './UsageFormatter.js'

export class Application {
	private readonly commandManager: CommandManager
	private readonly applicationDescription: string
	private readonly output: Output
	private readonly options: ApplicationOptions

	constructor(commandManager: CommandManager, applicationDescription: string, options?: ApplicationOptions)
	constructor(commandManager: CommandManager, applicationDescription: string, output: Output, options?: ApplicationOptions)
	constructor(
		commandManager: CommandManager,
		applicationDescription: string,
		outputOrOptions: Output | ApplicationOptions = {},
		options: ApplicationOptions = {},
	) {
		this.commandManager = commandManager
		this.applicationDescription = applicationDescription
		this.output = outputOrOptions instanceof Output ? outputOrOptions : new Output()
		this.options = outputOrOptions instanceof Output ? options : outputOrOptions
	}

	async run(args: string[]): Promise<void> {
		if (args.length === 0 || readGlobalOptionsFromArgs(args.slice(0, 1)).help) {
			exitProcess(await this.execute(args))
			return
		}
		const [name, ...commandArgs] = args
		await this.runCommandInternal(name, commandArgs, true)
	}

	public async runCommand(name: string, args: string[]): Promise<void> {
		await this.runCommandInternal(name, args, false)
	}

	public async runCommandInternal(name: string, args: string[], showCommandName: boolean): Promise<void> {
		exitProcess(await this.executeArgs([name, ...args], showCommandName))
	}

	/** Runs the given argv and returns the exit code instead of terminating the process. */
	public async execute(args: string[]): Promise<number> {
		const help = readGlobalOptionsFromArgs(args.slice(0, 1)).help
		if (args.length === 0 || help) {
			this.printApplicationHelp(help)
			return ExitCode.Success
		}
		return this.executeArgs(args, true)
	}

	public async executeCommand(name: string, args: string[]): Promise<number> {
		return this.executeArgs([name, ...args], false)
	}

	private async executeArgs(args: string[], showCommandName: boolean): Promise<number> {
		let entry: CommandCatalogEntry | undefined
		let command: ReturnType<CommandFactory> | undefined
		// the mode has to be known before anything can fail, so that every error is reported in the requested format
		this.output.applyGlobalOptions(readGlobalOptionsFromArgs(args))
		try {
			const resolution = this.commandManager.resolve(args)
			if (resolution.type === 'group') {
				this.printGroupHelp(resolution.name, resolution.entries)
				return ExitCode.Success
			}
			entry = resolution.entry
			const commandArgs = resolution.args
			command = entry.create()

			if (hasHelpFlag(commandArgs)) {
				this.printCommandHelp(entry.name, command, showCommandName)
				return ExitCode.Success
			}

			if (command.run !== Command.prototype.run) {
				await this.options.beforeRun?.({ command, args: commandArgs, name: entry.name })
				return await command.run(commandArgs, this.output)
			}

			const parsed = command.parse(commandArgs)
			this.output.applyGlobalOptions(parsed.globals)

			await this.options.beforeRun?.({ command, args: commandArgs, name: entry.name })

			return await command.runParsed(parsed, this.output)
		} catch (e) {
			const exitCode = renderCliError(e, this.output)
			if (e instanceof InvalidInputError && command !== undefined && this.output.mode === 'human') {
				const usage = command.getConfiguration().getUsage({ format: 'line' })
				this.output.writeStderr(`${showCommandName && entry ? chalk.greenBright(entry.name) + ' ' : ''}${chalk.green(usage)}`)
			}
			return exitCode
		}
	}

	private printApplicationHelp(verbose: boolean): void {
		this.output.writeStderr(this.applicationDescription)
		this.output.writeStderr(`Usage: <command> <command args>`)
		const commands = this.commandManager.getCommands()
		if (commands.length === 0) {
			return
		}
		const maxCommandNameLength = Math.max(...commands.map(it => it.name.length))
		const indent = '    '
		for (const entry of commands) {
			const configuration = entry.create().getConfiguration()
			this.output.writeStderr(`${indent}${chalk.greenBright(entry.name.padEnd(maxCommandNameLength))}${indent}${configuration.getDescription()}`)
			if (verbose) {
				const helpIndent = `${indent}${' '.repeat(maxCommandNameLength)}${indent}`
				const usage = configuration.getUsage({ format: 'multiline', indent: helpIndent })
				this.output.writeStderr(usage ? chalk.green(usage) : `${helpIndent}${chalk.gray('No options')}`)
			}
		}
	}

	private printGroupHelp(name: string, entries: readonly CommandCatalogEntry[]): void {
		this.output.writeStderr(`Usage: ${name} <command> <command args>`)
		const maxCommandNameLength = Math.max(...entries.map(it => it.name.length))
		const indent = '    '
		for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
			const configuration = entry.create().getConfiguration()
			this.output.writeStderr(`${indent}${chalk.greenBright(entry.name.padEnd(maxCommandNameLength))}${indent}${configuration.getDescription()}`)
		}
	}

	private printCommandHelp(name: string, command: ReturnType<CommandFactory>, showCommandName: boolean): void {
		if (showCommandName) {
			this.output.writeStderr(chalk.greenBright(name))
		}
		const configuration = command.getConfiguration()
		const commandDescription = configuration.getDescription()
		if (commandDescription) {
			this.output.writeStderr(commandDescription)
		}
		const shortUsage = configuration.getUsage({ format: 'short' })
		if (shortUsage) {
			this.output.writeStderr('\nUsage:')
			this.output.writeStderr(chalk.green(shortUsage))
			this.output.writeStderr('\nArguments and options:')
			this.output.writeStderr(configuration.getUsage({ format: 'multiline' }))
		}
		this.output.writeStderr('\nGlobal options:')
		this.output.writeStderr(UsageFormatter.format([], [...globalOptions], { format: 'multiline' }))
	}
}

interface ApplicationOptions {
	beforeRun?: (args: { command: ReturnType<CommandFactory>; name: string; args: string[] }) => void | Promise<void>
}
