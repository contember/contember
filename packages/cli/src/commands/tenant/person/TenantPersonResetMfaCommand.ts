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

/** Spells out every factor the server clears, so an incident report can be written straight off this payload. */
interface ResetMfaResult {
	personId: string
	mfaReset: true
	totpDisabled: true
	emailOtpDisabled: true
	backupCodesDeleted: true
}

export class TenantPersonResetMfaCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description(
			'Reset every MFA factor of a locked-out person: active and pending TOTP, e-mail OTP, and their backup codes. '
				+ 'The person can enroll again afterwards. An account-recovery operation, recorded in the auth log.',
		)
		configuration.argument('id').description('Person id.')
		configuration.option('yes').valueNone().description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const personId = input.getArgument('id')

		await requireConfirmation({
			yes: input.getOption('yes') === true,
			output,
			warning: `This will remove TOTP, e-mail OTP and the backup codes of person ${personId}, leaving the account without a second factor.`,
		})

		await this.tenantClientProvider.person().resetPersonMfa(personId)

		output.info(`MFA of person ${personId} was reset: TOTP and e-mail OTP disabled, backup codes deleted.`)
		output.data<ResetMfaResult>({
			personId,
			mfaReset: true,
			totpDisabled: true,
			emailOtpDisabled: true,
			backupCodesDeleted: true,
		}, { human: it => humanText(it.personId), quiet: it => it.personId })
	}
}
