import { InputParser, InvalidInputError } from './InputParser'
import { CommandManager } from './CommandManager'
import chalk from 'chalk'

export class Application {
	constructor(private readonly commandManager: CommandManager) {}

	async run(args: string[]): Promise<void> {
		const [{}, {}, ...commandArgs] = args

		const [name, ...rest] = commandArgs
		if (!name || name === '--help') {
			console.log(`Usage: <command> <command args>`)
			const commands = Object.entries(this.commandManager.commands)
				.filter(([name, factory], index, commands) => commands.findIndex(it => it[1] === factory) === index)
				.map(([name]) => name)
				.sort((a, b) => a.localeCompare(b))
			for (let commandName of commands) {
				const [, command] = this.commandManager.createCommand(commandName)
				const configuration = command.getConfiguration()
				const usage = configuration.getUsage()
				const commandUsage = usage ? ' ' + usage : ''
				const description = configuration.getDescription() ? ` - ${configuration.getDescription()}` : ''
				console.log(`\t${chalk.greenBright(commandName)}${chalk.green(commandUsage)}${description}`)
			}
			return process.exit(0)
		}

		const [fullName, command] = this.commandManager.createCommand(name)
		if (rest[0] === '--help') {
			console.log(chalk.greenBright(fullName))
			const configuration = command.getConfiguration()
			const commandDescription = configuration.getDescription()
			if (commandDescription) {
				console.log(commandDescription)
			}
			console.log('\nUsage:')
			console.log(chalk.green(configuration.getUsage('short')))
			console.log('\nArguments and options:')
			console.log(configuration.getUsage('multiline'))

			return process.exit(0)
		}

		try {
			const result = await command.run(rest)
			if (!result) {
				return process.exit(0)
			}
		} catch (e) {
			if (e instanceof InvalidInputError) {
				console.error(e.message)
				return process.exit(1)
			} else {
				console.error(e)
				return process.exit(2)
			}
		}
	}
}
