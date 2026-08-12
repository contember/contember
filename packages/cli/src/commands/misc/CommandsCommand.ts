import { Command, CommandConfiguration, CommandManager, globalOptions, Input, mergeOptions, Output } from '@contember/cli-common'

type Args = {}
type Options = {}

interface CommandInfo {
	name: string
	group: string | null
	description: string
	aliases: string[]
	arguments: { name: string; description: string | null; optional: boolean; variadic: boolean }[]
	options: {
		name: string
		shortcut: string | null
		description: string | null
		mode: string
		required: boolean
		deprecated: boolean
		global: boolean
	}[]
}

/** Machine readable catalog of the whole CLI — the entry point for an agent discovering the available commands. */
export class CommandsCommand extends Command<Args, Options> {
	private commandManager: CommandManager | undefined = undefined

	/** Set by the container: the catalog contains this very command, so the dependency cannot be constructor injected. */
	public setCommandManager(commandManager: CommandManager): void {
		this.commandManager = commandManager
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Lists all commands with their arguments and options')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		if (this.commandManager === undefined) {
			throw new Error('Command manager is not set')
		}
		const commands = this.commandManager.getCommands().map((entry): CommandInfo => {
			const configuration = entry.create().getConfiguration()
			const commandOptions = configuration.getOptions()
			return {
				name: entry.name,
				group: entry.group ?? null,
				description: configuration.getDescription(),
				aliases: [...entry.aliases],
				arguments: configuration.getArguments().map(it => ({
					name: it.name,
					description: it.description ?? null,
					optional: it.optional,
					variadic: it.variadic,
				})),
				options: mergeOptions(commandOptions, globalOptions).map(it => ({
					name: it.name,
					shortcut: it.shortcut ?? null,
					description: it.description ?? null,
					mode: it.mode,
					required: it.required,
					deprecated: it.deprecated,
					global: !commandOptions.includes(it),
				})),
			}
		})

		output.data(commands, {
			human: it => {
				const width = Math.max(0, ...it.map(command => command.name.length))
				return it.map(command => `${command.name.padEnd(width)}    ${command.description}`).join('\n')
			},
			quiet: it => it.map(command => command.name),
		})
	}
}
