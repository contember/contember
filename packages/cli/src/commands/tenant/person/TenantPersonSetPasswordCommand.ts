import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { resolveSecret } from './personInput.js'
import { requireConfirmation } from '../../../lib/tenant/confirmation.js'
import { humanText } from '../tenantOutput.js'
import { readStdinText, StdinReader } from '../../../lib/tenant/stdin.js'

type Args = {
	id: string
}

type Options = {
	['password-stdin']?: boolean
	['password-env']?: string
	yes?: boolean
}

interface SetPasswordResult {
	personId: string
	passwordChanged: true
}

export class TenantPersonSetPasswordCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdin: StdinReader = readStdinText,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description(
			'Set the password of a person. The new password is read from stdin or from an environment variable, never from the command line, '
				+ 'which would leak it into the shell history and into `ps`. The tenant password policy still applies.',
		)
		configuration.argument('id').description('Person id.')
		configuration.option('password-stdin').valueNone().description('Read the new plaintext password from stdin.')
		configuration.option('password-env').valueRequired().description('Read the new plaintext password from the named environment variable.')
		configuration.option('yes').valueNone().description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const personId = input.getArgument('id')
		const secret = await resolveSecret(
			[{ name: 'password', stdin: input.getOption('password-stdin') === true, env: input.getOption('password-env') }],
			this.readStdin,
		)
		if (secret === undefined) {
			throw new CliError('No password given. Pass --password-stdin or --password-env <VARIABLE>.', {
				code: 'PASSWORD_REQUIRED',
				exitCode: ExitCode.InputError,
			})
		}

		await requireConfirmation({
			yes: input.getOption('yes') === true,
			output,
			warning: `This will replace the password of person ${personId}.`,
		})

		await this.tenantClientProvider.person().changePassword(personId, secret.value)

		output.info(`Password of person ${personId} was changed.`)
		output.data<SetPasswordResult>({ personId, passwordChanged: true }, { human: it => humanText(it.personId), quiet: it => it.personId })
	}
}
