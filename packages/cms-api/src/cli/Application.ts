import BaseCommand from './BaseCommand'
import Option from '../core/cli/Option'
import InputParser from '../core/cli/InputParser'
import Command from '../core/cli/Command'
import UsageFormatter from '../core/cli/UsageFormatter'

class Application {
	constructor(private readonly commands: BaseCommand<any, any>[]) {
	}

	async run(args: string[]): Promise<void> {
		const [{}, consoleCommand, ...commandArgs] = args
		const globalOptions: Option[] = [
			{
				name: 'working-directory',
				shortcut: 'd',
				mode: Option.Mode.VALUE_REQUIRED,
				required: false,
			},
			{
				name: 'config-file',
				shortcut: 'c',
				mode: Option.Mode.VALUE_REQUIRED,
				required: false,
			},
			{
				name: 'projects-directory',
				shortcut: 'p',
				mode: Option.Mode.VALUE_REQUIRED,
				required: false,
			},
		]
		const inputParser = new InputParser([], globalOptions)

		type GlobalOptions = {
			['working-directory']: string | undefined,
			['config-file']: string | undefined,
			['projects-directory']: string | undefined
		}
		let globalInput: Command.Input<{}, GlobalOptions>
		try {
			globalInput = inputParser.parse(commandArgs, true)
		} catch (e) {
			if (e instanceof InputParser.InvalidInputError) {
				console.error(e.message)
				return process.exit(1)
			} else {
				console.error(e)
				return process.exit(2)
			}
		}
		const [name, ...rest] = globalInput.rest
		if (!name) {
			const globalUsage = UsageFormatter.format([], globalOptions)
			console.log(`Usage: node ${consoleCommand} ${globalUsage} <command> <command args>`)
			for (let command of this.commands.sort((a, b) => a.getName().localeCompare(b.getName()))) {
				const configuration = command.getConfiguration()
				const commandUsage = configuration.getUsage()
				const description = configuration.getDescription() ? ` - ${configuration.getDescription()}` : ''
				console.log(`\t${command.getName()} ${commandUsage}${description}`)
			}
			return process.exit(0)
		}

		const workingDirectory = globalInput.getOption('working-directory') || process.cwd()
		const configFile = globalInput.getOption('config-file') || `${workingDirectory}/src/config/config.yaml`
		const projectsDirectory = globalInput.getOption('projects-directory') || `${workingDirectory}/src/projects/`


		const command = this.commands.find(it => it.getName() === name)
		if (!command) {
			const err = new Error(`Undefined command ${name}`)
			console.error(err)
			return process.exit(1)
		}

		command.setGlobalOptions({ workingDirectory, configFile, projectsDirectory })

		try {
			const result  = await command.run(rest)
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
