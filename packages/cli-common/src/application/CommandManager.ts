import { Command } from './Command.js'
import { CliError, ExitCode } from './CliError.js'
import { InvalidConfigurationError } from './CommandConfiguration.js'

export type CommandFactory = () => Command<any, any>

/**
 * Keys sharing the very same factory are aliases of one command — the first one registered is the
 * canonical name. Both `migrations diff` and `migrations:diff` resolve to the same command.
 */
export type CommandFactoryList = { [command: string]: CommandFactory }

export interface CommandCatalogEntry {
	/** canonical name, space separated */
	readonly name: string
	readonly tokens: readonly string[]
	readonly group: string | undefined
	readonly aliases: readonly string[]
	readonly create: CommandFactory
}

export type CommandResolution =
	| { readonly type: 'command'; readonly entry: CommandCatalogEntry; readonly args: string[] }
	| { readonly type: 'group'; readonly name: string; readonly entries: readonly CommandCatalogEntry[]; readonly args: string[] }

const splitTokens = (name: string): string[] => name.split(/[\s:]+/).filter(it => it !== '')

export class CommandManager {
	private readonly entries: CommandCatalogEntry[]
	/** normalized name (canonical or alias) => entry */
	private readonly lookup = new Map<string, CommandCatalogEntry>()
	/** every strict token prefix of a command name => commands in that group */
	private readonly groups = new Map<string, CommandCatalogEntry[]>()
	private readonly maxTokens: number

	constructor(public readonly commands: CommandFactoryList) {
		this.entries = createCatalog(commands)
		for (const entry of this.entries) {
			for (const name of [entry.name, ...entry.aliases]) {
				const tokens = splitTokens(name)
				const normalizedName = tokens.join(' ')
				const existing = this.lookup.get(normalizedName)
				if (existing !== undefined && existing.create !== entry.create) {
					throw new InvalidConfigurationError(
						`Command names "${existing.name}" and "${name}" both normalize to "${normalizedName}" but use different factories.`,
					)
				}
				this.lookup.set(normalizedName, entry)
				for (let i = 1; i < tokens.length; i++) {
					const prefix = tokens.slice(0, i).join(' ')
					const group = this.groups.get(prefix) ?? []
					if (!group.includes(entry)) {
						group.push(entry)
					}
					this.groups.set(prefix, group)
				}
			}
		}
		this.maxTokens = Math.max(1, ...[...this.lookup.keys()].map(it => splitTokens(it).length))
		this.validateNoPrefixCollision()
	}

	public getCommands(): readonly CommandCatalogEntry[] {
		return [...this.entries].sort((a, b) => a.name.localeCompare(b.name))
	}

	/**
	 * Resolves the longest command name matching the leading argv tokens. `migrations diff`,
	 * `migrations:diff` and the `m:d` shorthand all resolve to the same command; the tokens that were
	 * not consumed are returned untouched as the command arguments.
	 */
	public resolve(args: string[]): CommandResolution {
		const tokens: string[] = []
		const checkpoints: { tokens: string[]; argvIndex: number }[] = []
		for (let i = 0; i < args.length; i++) {
			if (args[i].startsWith('-')) {
				break
			}
			const parts = splitTokens(args[i])
			if (parts.length === 0 || tokens.length + parts.length > this.maxTokens) {
				break
			}
			tokens.push(...parts)
			checkpoints.push({ tokens: [...tokens], argvIndex: i + 1 })
		}

		for (let i = checkpoints.length - 1; i >= 0; i--) {
			const entry = this.lookup.get(checkpoints[i].tokens.join(' '))
			if (entry) {
				return { type: 'command', entry, args: args.slice(checkpoints[i].argvIndex) }
			}
		}

		const group = this.groups.get(tokens.join(' '))
		if (group !== undefined && group.length > 0) {
			const argvIndex = checkpoints[checkpoints.length - 1]?.argvIndex ?? 0
			return { type: 'group', name: tokens.join(' '), entries: group, args: args.slice(argvIndex) }
		}

		for (let i = checkpoints.length - 1; i >= 0; i--) {
			// a group named in full must be followed by a verb — never let it swallow the remaining tokens as arguments
			if (i < checkpoints.length - 1 && this.groups.has(checkpoints[i].tokens.join(' '))) {
				continue
			}
			const matched = this.matchShorthand(checkpoints[i].tokens)
			if (matched.length === 1) {
				return { type: 'command', entry: matched[0], args: args.slice(checkpoints[i].argvIndex) }
			}
			if (matched.length > 1) {
				throw new CliError(
					`Command "${checkpoints[i].tokens.join(' ')}" is ambiguous. Did you mean one of these?\n - ${matched.map(it => it.name).join('\n - ')}`,
					{ code: 'COMMAND_AMBIGUOUS', exitCode: ExitCode.InputError },
				)
			}
		}

		// the leading tokens name a known group, but the verb does not exist in it
		for (let i = tokens.length - 1; i >= 1; i--) {
			const known = this.groups.get(tokens.slice(0, i).join(' '))
			if (known !== undefined && known.length > 0) {
				throw new CliError(
					`Command "${tokens.join(' ')}" not found. Available commands in "${tokens.slice(0, i).join(' ')}":\n - ${
						known.map(it => it.name).sort((a, b) => a.localeCompare(b)).join('\n - ')
					}`,
					{ code: 'COMMAND_NOT_FOUND', exitCode: ExitCode.InputError },
				)
			}
		}

		throw new CliError(`Command "${args[0] ?? ''}" not found.`, { code: 'COMMAND_NOT_FOUND', exitCode: ExitCode.InputError })
	}

	public createCommand(name: string): [string, Command<any, any>] {
		const resolution = this.resolve([name])
		if (resolution.type === 'group') {
			throw new CliError(
				`Command "${resolution.name}" is a command group. Available commands:\n - ${resolution.entries.map(it => it.name).join('\n - ')}`,
				{ code: 'COMMAND_AMBIGUOUS', exitCode: ExitCode.InputError },
			)
		}
		return [resolution.entry.name, resolution.entry.create()]
	}

	/** Prefix matching of the abbreviated form: `m:d` => `migrations diff`, `w:u` => `workspace update api`. */
	private matchShorthand(tokens: string[]): CommandCatalogEntry[] {
		if (tokens.length === 0) {
			return []
		}
		return this.entries.filter(entry => entry.tokens.length >= tokens.length && tokens.every((token, index) => entry.tokens[index].startsWith(token)))
	}

	private validateNoPrefixCollision(): void {
		const names = [...this.lookup.keys()]
		for (const name of names) {
			for (const other of names) {
				if (other !== name && other.startsWith(name + ' ')) {
					throw new InvalidConfigurationError(
						`Command name "${name}" is a prefix of "${other}". A command name must not be a prefix of another command name, otherwise it could never be resolved.`,
					)
				}
			}
		}
	}
}

const createCatalog = (commands: CommandFactoryList): CommandCatalogEntry[] => {
	const byFactory = new Map<CommandFactory, { name: string; aliases: string[] }>()
	for (const [name, factory] of Object.entries(commands)) {
		const registered = byFactory.get(factory)
		if (registered) {
			registered.aliases.push(name)
		} else {
			byFactory.set(factory, { name, aliases: [] })
		}
	}
	return [...byFactory].map(([factory, { name, aliases }]) => {
		const tokens = splitTokens(name)
		return {
			name: tokens.join(' '),
			tokens,
			group: tokens.length > 1 ? tokens[0] : undefined,
			aliases,
			create: factory,
		}
	})
}
