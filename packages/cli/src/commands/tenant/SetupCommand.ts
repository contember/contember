import { Command, CommandConfiguration, Input } from '../../cli'
import { interactiveAskForCredentials, setup } from '../../utils/tenant'

type Args = {
	apiUrl: string
}

type Options = {}

export class SetupCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates superadmin and login key')
		configuration.argument('apiUrl').description('Contember API URL')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		if (!process.stdin.isTTY) {
			throw 'This command is interactive and requires TTY'
		}
		const apiUrl = input.getArgument('apiUrl')
		const credentials = await interactiveAskForCredentials()

		await setup(apiUrl, credentials)
	}
}
