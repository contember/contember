import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'

type Args = {}
type Options = {}

export class TenantConfigShowCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Show the tenant-wide configuration (signup, password policy, login, captcha, rate limits)')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const config = await this.tenantClientProvider.project().configuration()
		output.data(config)
	}
}
