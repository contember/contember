import { Command, CommandConfiguration, Input } from '../../cli'
import {
	interactiveCreateApiKey,
	interactiveResolveApiToken,
	resolveTenantInstanceEnvironmentFromInput,
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
		const instance = await resolveTenantInstanceEnvironmentFromInput(input)
		const apiToken = await interactiveResolveApiToken({ instance })
		const { id, token } = await interactiveCreateApiKey({ instance, apiToken })
		console.log('API key created:')
		console.log(`id: ${id}`)
		console.log(`token: ${token}`)
	}
}
