import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { RemoteIdentityProvider } from '../../../lib/tenant/clients/TenantProjectClient.js'

type Args = {}
type Options = {}

export class TenantIdpListCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('List configured identity providers')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const idps = await this.tenantClientProvider.project().listIdentityProviders()
		output.table<RemoteIdentityProvider>(
			[{ field: 'slug', name: 'Slug' }, { field: 'type', name: 'Type' }, { field: 'disabledAt', name: 'Disabled At' }],
			idps,
			'slug',
		)
	}
}
