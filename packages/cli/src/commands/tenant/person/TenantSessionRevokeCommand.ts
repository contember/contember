import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { requireConfirmation } from '../../../lib/tenant/confirmation.js'
import { humanText } from '../tenantOutput.js'

type Args = {
	sessionId: string
}

type Options = {
	yes?: boolean
}

interface RevokeSessionResult {
	sessionId: string
	revoked: true
}

export class TenantSessionRevokeCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Revoke a single session. Session ids are listed by "tenant person show".')
		configuration.argument('sessionId').description('Session id, as listed by "tenant person show".')
		configuration.option('yes').valueNone().description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const sessionId = input.getArgument('sessionId')

		await requireConfirmation({
			yes: input.getOption('yes') === true,
			output,
			warning: `This will revoke session ${sessionId}, signing out whoever holds it.`,
		})

		await this.tenantClientProvider.person().revokeSession(sessionId)

		output.info(`Session ${sessionId} was revoked.`)
		output.data<RevokeSessionResult>({ sessionId, revoked: true }, { human: it => humanText(it.sessionId), quiet: it => it.sessionId })
	}
}
