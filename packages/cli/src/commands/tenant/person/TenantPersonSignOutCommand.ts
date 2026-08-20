import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { requireConfirmation } from '../../../lib/tenant/confirmation.js'
import { humanText } from '../tenantOutput.js'

type Args = {
	id: string
}

type Options = {
	reason?: string
	yes?: boolean
}

interface SignOutResult {
	personId: string
	signedOut: true
	/** Recorded in the tenant auth log next to the sign-out event. */
	reason: string | null
}

export class TenantPersonSignOutCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description(
			'Force sign-out: revoke every active session and disable all attached API keys, including permanent keys. An account-recovery operation, recorded in the auth log.',
		)
		configuration.argument('id').description('Person id.')
		configuration.option('reason').valueRequired().description('Reason stored with the auth log entry, e.g. an incident id.')
		configuration.option('yes').valueNone().description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const personId = input.getArgument('id')
		const reason = input.getOption('reason')

		await requireConfirmation({
			yes: input.getOption('yes') === true,
			output,
			warning: `This will revoke every active session and disable all attached API keys of person ${personId}, including permanent keys.`,
		})

		await this.tenantClientProvider.person().forceSignOutPerson(personId, reason)

		output.info(
			`Every session of person ${personId} was revoked and all attached API keys, including permanent keys, were disabled${
				reason !== undefined ? ` (reason: ${reason})` : ''
			}.`,
		)
		output.data<SignOutResult>(
			{ personId, signedOut: true, reason: reason ?? null },
			{ human: it => humanText(it.personId), quiet: it => it.personId },
		)
	}
}
