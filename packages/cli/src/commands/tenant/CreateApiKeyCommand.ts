import { Command, CommandConfiguration, Input } from '../../cli'
import {
	interactiveCreateApiKey,
	interactiveResolveApiToken,
	interactiveResolveTenantInstanceEnvironmentFromInput,
	TenantClient,
} from '../../utils/tenant'

type Args = {
	instance?: string
}

type Options = {}

export class CreateApiKeyCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates an API key')
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
		const { id, token } = await interactiveCreateApiKey({ client: tenantClient })
		console.log('API key created:')
		console.log(`id: ${id}`)
		console.log(`token: ${token}`)
	}
}
