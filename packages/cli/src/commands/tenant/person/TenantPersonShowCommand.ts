import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { TenantPersonDetail } from '../../../lib/tenant/clients/TenantPersonClient.js'
import { humanText } from '../tenantOutput.js'

type Args = {
	id: string
}

type Options = {}

/** Renders the whole record as an indented block — the sessions are what `tenant session revoke` needs. */
const formatPersonDetail = (person: TenantPersonDetail): string => {
	const lines = [
		`Person:       ${humanText(person.id)}`,
		`Identity:     ${humanText(person.identityId)}`,
		`E-mail:       ${person.email === null ? '-' : humanText(person.email)} (${person.emailVerified ? 'verified' : 'unverified'})`,
		`Name:         ${person.name === null ? '-' : humanText(person.name)}`,
		`Roles:        ${person.roles === null ? '(not visible)' : person.roles.map(humanText).join(', ') || '-'}`,
		`TOTP:         ${person.otpEnabled ? 'enabled' : 'disabled'}`,
		`E-mail OTP:   ${person.emailOtpEnabled ? 'enabled' : 'disabled'}`,
		`Passwordless: ${person.passwordlessEnabled === null ? '(unset)' : person.passwordlessEnabled ? 'enabled' : 'disabled'}`,
		`Sessions:     ${person.sessions.length === 0 ? 'none' : ''}`,
	]
	for (const session of person.sessions) {
		lines.push(
			`  ${humanText(session.id)}  created ${humanText(session.createdAt)}  last used ${
				session.lastUsedAt === null ? '-' : humanText(session.lastUsedAt)
			}  from ${session.lastIp === null ? '-' : humanText(session.lastIp)}`,
		)
	}
	lines.push(`Identity providers: ${person.identityProviders.length === 0 ? 'none' : ''}`)
	for (const idp of person.identityProviders) {
		lines.push(
			`  ${humanText(idp.slug)} (${humanText(idp.type)})  external id ${humanText(idp.externalIdentifier)}  connected ${humanText(idp.createdAt)}`,
		)
	}
	return lines.join('\n')
}

export class TenantPersonShowCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Show a single person with their roles, active sessions and identity provider connections.')
		configuration.argument('id').description('Person id.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const id = input.getArgument('id')
		const person = await this.tenantClientProvider.person().getPerson(id)
		if (person === null) {
			// the API returns null for both cases and does not tell them apart, so neither can we
			throw new CliError(`Person ${id} was not found, or you are not allowed to view them.`, {
				code: 'PERSON_NOT_FOUND',
				exitCode: ExitCode.NotFound,
			})
		}
		if (person.roles === null) {
			output.info('Roles are hidden: your token may not read the roles of this identity.')
		}
		output.data(person, formatPersonDetail)
	}
}
