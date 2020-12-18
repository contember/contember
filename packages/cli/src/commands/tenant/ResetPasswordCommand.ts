import { Command, CommandConfiguration, Input } from '../../cli'
import { interactiveResetPassword, interactiveResolveLoginToken } from '../../utils/tenant'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { Workspace } from '../../utils/Workspace'

type Args = {
	instance?: string
}

type Options = {}

export class ResetPasswordCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Resets user password')
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
		await interactiveResetPassword({ apiUrl: instance.baseUrl, loginToken })
	}
}
