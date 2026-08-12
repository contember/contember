import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { requireConfirmation } from '../../../lib/tenant/confirmation.js'
import { humanText } from '../tenantOutput.js'

type Args = {
	id: string
}

type Options = {
	yes?: true
}

/** `tenant api-key disable <id>` — destructive: the key's token stops working immediately. */
export class TenantApiKeyDisableCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Disable a permanent API key, revoking its token immediately')
		configuration.argument('id').description('The api key id (ApiKey.id — not the token).')
		configuration //
			.option('yes')
			.valueNone()
			.description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const id = input.getArgument('id')

		await requireConfirmation({
			yes: input.getOption('yes') === true,
			output,
			warning: `API key ${id} will be disabled and its token will stop working immediately.`,
		})

		await this.tenantClientProvider.apiKey().disableApiKey(id)

		output.data({ id }, {
			human: it => `API key ${humanText(it.id)} disabled`,
			quiet: it => it.id,
		})
	}
}
