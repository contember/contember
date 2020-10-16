import { InvalidInputError } from './InputParser'
import { CommandManager } from './CommandManager'
import chalk from 'chalk'
import { getCliVersion, getRequestedCliVersion } from '../utils/contember'

export class Application {
	constructor(private readonly commandManager: CommandManager) {}

	async run(args: string[]): Promise<void> {
		const [{}, {}, ...commandArgs] = args

		const [name, ...rest] = commandArgs
		const version = getCliVersion()
		const requestedVersion = await getRequestedCliVersion()
		if (requestedVersion && requestedVersion !== version) {
			console.error(
				chalk.bgRed.black(
					`Lockfile CLI version ${requestedVersion} does not match installed version ${version}. Did you run npm ci?`,
				),
			)
		}
		if (!name || name === '--help') {
			console.error(`Contember CLI version ${version}`)
			console.error(`Usage: <command> <command args>`)
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
				console.error(`\t${chalk.greenBright(commandName)}${chalk.green(commandUsage)}${description}`)
			}
			return process.exit(0)
		}

		const [fullName, command] = this.commandManager.createCommand(name)

		if (rest[0] === '--help' || rest[0] === '-h') {
			console.error(chalk.greenBright(fullName))
			const configuration = command.getConfiguration()
			const commandDescription = configuration.getDescription()
			if (commandDescription) {
				console.error(commandDescription)
			}
			console.error('\nUsage:')
			console.error(chalk.green(configuration.getUsage('short')))
			console.error('\nArguments and options:')
			console.error(configuration.getUsage('multiline'))

			return process.exit(0)
		}

		try {
			const result = await command.run(rest)
			return process.exit(result)
		} catch (e) {
			if (e instanceof InvalidInputError) {
				console.error(chalk.bgRedBright.white(e.message))
				const configuration = command.getConfiguration()
				console.error(`${chalk.greenBright(fullName)} ${chalk.green(configuration.getUsage('line'))}`)

				return process.exit(1)
			} else {
				console.error(e)
				return process.exit(2)
			}
		}
	}
}
