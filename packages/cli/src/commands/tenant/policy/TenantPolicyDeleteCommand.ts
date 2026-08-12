import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { requireConfirmation } from '../../../lib/tenant/confirmation.js'
import { humanText } from '../tenantOutput.js'

type Args = {
	id: string
}

type Options = {
	yes?: boolean
}

export class TenantPolicyDeleteCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Delete an auth policy.')
		configuration.argument('id').description('Id of the auth policy, as printed by "tenant policy list".')
		configuration.option('yes').valueNone().description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const id = input.getArgument('id')
		await requireConfirmation({
			yes: input.getOption('yes') === true,
			output,
			warning: `Auth policy ${id} will be deleted. The roles it covers fall back to the tenant defaults.`,
		})

		await this.tenantClientProvider.policy().deleteAuthPolicy(id)

		output.data({ id }, {
			human: result => `Deleted auth policy ${humanText(result.id)}.`,
			quiet: result => result.id,
		})
	}
}
