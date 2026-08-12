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

interface DisableResult {
	personId: string
	disabled: true
}

export class TenantPersonDisableCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Disable a person. They can no longer sign in and all of their API keys are invalidated.')
		configuration.argument('id').description('Person id.')
		configuration.option('yes').valueNone().description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const personId = input.getArgument('id')

		await requireConfirmation({
			yes: input.getOption('yes') === true,
			output,
			warning: `This will disable person ${personId} and invalidate all of their API keys.`,
		})

		await this.tenantClientProvider.person().disablePerson(personId)

		output.info(`Person ${personId} was disabled.`)
		output.data<DisableResult>({ personId, disabled: true }, { human: it => humanText(it.personId), quiet: it => it.personId })
	}
}
