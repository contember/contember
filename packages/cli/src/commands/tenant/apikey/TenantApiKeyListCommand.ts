import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { TenantApiKey } from '../../../lib/tenant/clients/TenantApiKeyClient.js'
import { humanText } from '../tenantOutput.js'

type Args = {}
type Options = {
	project?: string
}

/** `tenant api-key list` — global keys by default, or project-scoped keys selected by `--project`. */
export class TenantApiKeyListCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('List global permanent API keys, or project-scoped keys with --project')
		configuration.option('project').valueRequired().description('List permanent API keys scoped to this project slug instead of global keys.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const project = input.getOption('project')
		const apiKeys = project === undefined
			? await this.tenantClientProvider.apiKey().listGlobalApiKeys()
			: await this.tenantClientProvider.apiKey().listProjectApiKeys(project)

		output.table<TenantApiKey>(
			[
				{ field: 'id', name: 'ID' },
				{ field: 'description', name: 'Description' },
				{ field: 'type', name: 'Type' },
				{ field: 'enabled', name: 'Enabled' },
				{ field: 'createdAt', name: 'Created At' },
				{ field: 'lastUsedAt', name: 'Last Used At', format: value => value === null ? 'never used' : humanText(value) },
				{ field: 'expiresAt', name: 'Expires At', format: value => value === null ? 'never expires' : humanText(value) },
			],
			apiKeys,
			'id',
		)
	}
}
