import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import type { TenantCreatedSessionToken } from '../../../lib/tenant/clients/TenantPersonClient.js'
import { assertGeneratedTenantToken, humanText } from '../tenantOutput.js'

type Args = {}

type Options = {
	email?: string
	['person-id']?: string
	expiration?: string
	['trust-forwarded-client-info']?: boolean
}

/** `tenant session create` */
export class TenantSessionCreateCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Create a one-time session token for exactly one person. Requires person.createSessionToken permission.')
		configuration.option('email').valueRequired().description('Identify the person by e-mail. Not combinable with --person-id.')
		configuration.option('person-id').valueRequired().description('Identify the person by id. Not combinable with --email.')
		configuration.option('expiration').valueRequired().description('Session lifetime in minutes as a positive integer.')
		configuration.option('trust-forwarded-client-info').valueNone().description(
			'Trust forwarded client IP and user-agent headers for this session only when the tenant endpoint is behind a trusted proxy.',
		)
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const email = input.getOption('email')
		const personId = input.getOption('person-id')
		if ((email === undefined) === (personId === undefined)) {
			throw new CliError('Pass exactly one of --email or --person-id.', {
				code: 'INVALID_PERSON_IDENTIFIER',
				exitCode: ExitCode.InputError,
			})
		}
		if (email?.trim() === '' || personId?.trim() === '') {
			throw new CliError('The value passed to --email or --person-id must not be empty.', {
				code: 'INVALID_PERSON_IDENTIFIER',
				exitCode: ExitCode.InputError,
			})
		}
		const expiration = parsePositiveInteger(input.getOption('expiration'), 'expiration')
		const trustForwardedClientInfo = input.getOption('trust-forwarded-client-info') === true

		const result = await this.tenantClientProvider.person().createSessionToken({
			email,
			personId,
			expiration,
			options: trustForwardedClientInfo ? { trustForwardedClientInfo: true } : undefined,
		})
		const token = assertGeneratedTenantToken(result.token, 'session')

		output.info(`Created a session token for person ${result.personId}. The token is shown once; store it securely.`)
		output.data<TenantCreatedSessionToken>(result, {
			human: it => `Session token for person ${humanText(it.personId)}:\n${token}`,
			quiet: () => token,
		})
	}
}

const parsePositiveInteger = (value: string | undefined, option: string): number | undefined => {
	if (value === undefined) {
		return undefined
	}
	const parsed = Number(value)
	if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 2_147_483_647) {
		throw new CliError(`--${option} must be a positive GraphQL Int (maximum 2147483647).`, {
			code: 'INVALID_OPTION_VALUE',
			exitCode: ExitCode.InputError,
		})
	}
	return parsed
}
