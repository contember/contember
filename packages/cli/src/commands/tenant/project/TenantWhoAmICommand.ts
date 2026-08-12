import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'

type Args = {}
type Options = {}

export class TenantWhoAmICommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Show the identity, global roles and project access of the current API token')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const me = await this.tenantClientProvider.project().whoAmI()
		output.data(me, { quiet: it => it.id })
	}
}
