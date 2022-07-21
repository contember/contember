import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { interactiveInvite, interactiveResolveApiToken, TenantClient } from '../../utils/tenant'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { Workspace } from '@contember/cli-common'

type Args = {
	instance?: string
}

type Options = {}

export class InviteCommand extends Command<Args, Options> {
	constructor(
		private readonly workspace: Workspace,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Invites a user by an email')
		configuration //
			.argument('instance')
			.optional()
			.description('Local instance name or remote Contember API URL')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		if (!process.stdin.isTTY) {
			throw 'This command is interactive and requires TTY'
		}
		const workspace = this.workspace
		const instance = await interactiveResolveInstanceEnvironmentFromInput(workspace, input.getArgument('instance'))
		const apiToken = await interactiveResolveApiToken({ workspace, instance })
		const tenantClient = TenantClient.create(instance.baseUrl, apiToken)
		await interactiveInvite({ client: tenantClient })
		console.log('User has been invited')
	}
}
