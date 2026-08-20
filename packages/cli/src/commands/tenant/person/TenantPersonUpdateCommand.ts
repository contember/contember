import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { humanText, requireNonEmptyTenantName } from '../tenantOutput.js'

type Args = {
	id: string
}

type Options = {
	email?: string
	name?: string
}

interface UpdateResult {
	personId: string
	/** Null means the field was left alone — the API cannot clear an e-mail or a name. */
	email: string | null
	name: string | null
}

export class TenantPersonUpdateCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Change the profile of a person. Only the fields you pass are changed; neither can be cleared.')
		configuration.argument('id').description('Person id.')
		configuration.option('email').valueRequired().description('New e-mail address.')
		configuration.option('name').valueRequired().description('New display name.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const personId = input.getArgument('id')
		const email = input.getOption('email')
		const name = requireNonEmptyTenantName(input.getOption('name'), 'Person')
		if (email === undefined && name === undefined) {
			throw new CliError('Nothing to update. Pass --email, --name, or both.', {
				code: 'NOTHING_TO_UPDATE',
				exitCode: ExitCode.InputError,
			})
		}

		await this.tenantClientProvider.person().changeProfile(personId, { email, name })

		const changed = [email !== undefined ? 'e-mail' : null, name !== undefined ? 'name' : null].filter(it => it !== null)
		output.info(`Updated ${changed.join(' and ')} of person ${personId}.`)
		output.data<UpdateResult>(
			{ personId, email: email ?? null, name: name ?? null },
			{ human: it => humanText(it.personId), quiet: it => it.personId },
		)
	}
}
