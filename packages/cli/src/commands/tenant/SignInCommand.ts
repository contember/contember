import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { interactiveResolveLoginToken, interactiveSignIn } from '../../utils/tenant'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { Workspace } from '../../utils/Workspace'

type Args = {
	instance?: string
}

type Options = {}

export class SignInCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Signs in a user')
		configuration //
			.argument('instance')
			.optional()
			.description('Local instance name or remote Contember API URL')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		if (!process.stdin.isTTY) {
			throw 'This command is interactive and requires TTY'
		}
		const workspace = await Workspace.get(process.cwd())
		const instance = await interactiveResolveInstanceEnvironmentFromInput(workspace, input.getArgument('instance'))
		const loginToken = await interactiveResolveLoginToken(instance)
		const { sessionToken } = await interactiveSignIn({ apiUrl: instance.baseUrl, loginToken })
		console.log('Session token:')
		console.log(sessionToken)
	}
}
