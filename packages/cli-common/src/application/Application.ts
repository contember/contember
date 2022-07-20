import { InvalidInputError } from './InputParser'
import { CommandManager } from './CommandManager'
import chalk from 'chalk'

export class Application {
	constructor(private readonly commandManager: CommandManager, private readonly applicationDescription: string) {}

	async run(args: string[]): Promise<void> {
		const [name, ...rest] = args
		if (!name || name === '--help') {
			console.error(this.applicationDescription)
			console.error(`Usage: <command> <command args>`)
			const commands = Object.entries(this.commandManager.commands)
				.filter(([name, factory], index, commands) => commands.findIndex(it => it[1] === factory) === index)
				.map(([name]) => name)
				.sort((a, b) => a.localeCompare(b))

			const maxCommandNameLength = Math.max(...commands.map(it => it.length))

			for (let commandName of commands) {
				const [, command] = this.commandManager.createCommand(commandName)
				const configuration = command.getConfiguration()
				const indent = '    '
				console.error(
					`${indent}${chalk.greenBright(
						commandName.padEnd(maxCommandNameLength),
					)}${indent}${configuration.getDescription()}`,
				)
				if (name === '--help') {
					const helpIndent = `${indent}${' '.repeat(maxCommandNameLength)}${indent}`
					const usage = configuration.getUsage({ format: 'multiline', indent: helpIndent })
					if (usage) {
						console.error(chalk.green(usage))
					} else {
						console.error(`${helpIndent}${chalk.gray('No options')}`)
					}
				}
			}

			return process.exit(0)
		}
		return this.runCommandInternal(name, rest, true)
	}

	public async runCommand(name: string, args: string[]) {
		return this.runCommandInternal(name, args, false)
	}

	public async runCommandInternal(name: string, args: string[], showCommandName: boolean) {
		const [fullName, command] = this.commandManager.createCommand(name)

		if (args[0] === '--help' || args[0] === '-h') {
			if (showCommandName) {
				console.error(chalk.greenBright(fullName))
			}
			const configuration = command.getConfiguration()
			const commandDescription = configuration.getDescription()
			if (commandDescription) {
				console.error(commandDescription)
			}
			const shortUsage = configuration.getUsage({ format: 'short' })
			if (shortUsage) {
				console.error('\nUsage:')
				console.error(chalk.green(shortUsage))
				console.error('\nArguments and options:')
				console.error(configuration.getUsage({ format: 'multiline' }))
			}

			return process.exit(0)
		}

		try {
			const result = await command.run(args)
			return process.exit(result)
		} catch (e) {
			if (e instanceof InvalidInputError) {
				console.error(chalk.bgRedBright.white(e.message))
				const configuration = command.getConfiguration()
				console.error(`${showCommandName ? chalk.greenBright(fullName) + ' ' : ''}${chalk.green(configuration.getUsage({ format: 'line' }))}`)

				return process.exit(1)
			} else {
				console.error(e)
				return process.exit(2)
			}
		}
	}
}
