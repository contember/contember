import { Command, CommandConfiguration, Input } from '../../cli'
import {
	interactiveCreateApiKey,
	interactiveInvite,
	interactiveResolveApiToken,
	interactiveResolveTenantInstanceEnvironmentFromInput,
	TenantClient,
} from '../../utils/tenant'

type Args = {
	instance?: string
}

type Options = {}

export class InviteCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Invites a user by an email')
		configuration
			.argument('instance')
			.optional()
			.description('Local instance name or remote Contember API URL')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		if (!process.stdin.isTTY) {
			throw 'This command is interactive and requires TTY'
		}
		const instance = await interactiveResolveTenantInstanceEnvironmentFromInput(input)
		const apiToken = await interactiveResolveApiToken({ instance })
		const tenantClient = TenantClient.create(instance.url, apiToken)
		await interactiveInvite({ client: tenantClient })
		console.log('User has been invited')
	}
}
