import CommandConfiguration from '../cli/CommandConfiguration'
import Command from '../cli/Command'
import { Input } from '../cli/Input'
import { interactiveSetup } from '../utils/setup'

type Args = {
	apiUrl: string
}

type Options = {}

class SetupCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates superadmin and login key')
		configuration.argument('apiUrl').description('Contember API URL')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const apiUrl = input.getArgument('apiUrl')

		const { loginToken } = await interactiveSetup(apiUrl)
		console.log('Superadmin created.')
		console.log('Login token: ' + loginToken)
	}
}

export default SetupCommand
