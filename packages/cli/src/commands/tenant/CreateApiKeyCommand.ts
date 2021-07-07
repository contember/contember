import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { interactiveCreateApiKey, interactiveResolveApiToken, TenantClient } from '../../utils/tenant'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { Workspace } from '../../utils/Workspace'

type Args = {
	instance?: string
}

type Options = {}

export class CreateApiKeyCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates an API key')
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
		const apiToken = await interactiveResolveApiToken({ instance })
		const tenantClient = TenantClient.create(instance.baseUrl, apiToken)
		const { id, token } = await interactiveCreateApiKey({ client: tenantClient })
		console.log('API key created:')
		console.log(`id: ${id}`)
		console.log(`token: ${token}`)
	}
}
