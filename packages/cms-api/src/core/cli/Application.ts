import InputParser from './InputParser'
import { CommandManager } from './CommandManager'

class Application {
	constructor(private readonly commandManager: CommandManager) {}

	async run(args: string[]): Promise<void> {
		const [{}, {}, ...commandArgs] = args

		const [name, ...rest] = commandArgs
		if (!name) {
			console.log(`Usage: <command> <command args>`)
			for (let commandName of this.commandManager.getNames().sort((a, b) => a.localeCompare(b))) {
				const command = this.commandManager.createCommand(commandName)!
				const configuration = command.getConfiguration()
				const commandUsage = configuration.getUsage()
				const description = configuration.getDescription() ? ` - ${configuration.getDescription()}` : ''
				console.log(`\t${commandName} ${commandUsage}${description}`)
			}
			return process.exit(0)
		}

		const command = this.commandManager.createCommand(name)
		if (!command) {
			const err = new Error(`Undefined command ${name}`)
			console.error(err)
			return process.exit(1)
		}

		try {
			const result = await command.run(rest)
			if (!result) {
				return process.exit(0)
			}
		} catch (e) {
			if (e instanceof InputParser.InvalidInputError) {
				console.error(e.message)
				return process.exit(1)
			} else {
				console.error(e)
				return process.exit(2)
			}
		}
	}
}

export default Application
