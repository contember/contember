import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { formatMemberships, requireOptionValue } from './memberOptions.js'
import { configureMembershipOptions, MembershipOptions, readMembershipInputSource, resolveMemberships } from './membershipInput.js'
import { readStdinText, StdinReader } from '../../../lib/tenant/stdin.js'
import { environmentInput, literalInput, resolveRequiredTenantInput, stdinInput, type TenantInputSource } from '../../../lib/tenant/input/index.js'
import { humanText } from '../tenantOutput.js'

type Args = {}

type Options = MembershipOptions & {
	project?: string
	email?: string
	password?: string
	['password-env']?: string
	['password-stdin']?: boolean
	['reset-token-hash']?: string
	['reset-token-hash-env']?: string
	['reset-token-hash-stdin']?: boolean
}

/**
 * `tenant member invite-unmanaged`
 *
 * The no-mail half of the invite pair — the caller sets the credential itself. Kept apart from
 * `tenant member invite` because the option sets are disjoint and this one handles a secret.
 *
 * The password is never a positional argument. `--password-env` is the safe form: only the variable name
 * reaches the shell history and the process list.
 *
 * `unmanagedInvite` accepts a `name` in the schema but its resolver ignores it, so no `--name` is offered.
 */
export class TenantMemberInviteUnmanagedCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdin: StdinReader = readStdinText,
		private readonly env: NodeJS.ProcessEnv = process.env,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Invite a person to a project without sending any e-mail')
		configuration.option('project').valueRequired().required().description('Project slug.')
		configuration.option('email').valueRequired().required().description('E-mail address of the invited person.')
		configuration.option('password-env').valueRequired().description(
			'Name of the environment variable holding the initial password. Preferred over --password.',
		)
		configuration.option('password').valueRequired().description(
			'Initial password. Visible in the shell history and in the process list — prefer --password-env.',
		)
		configuration.option('password-stdin').valueNone().description('Read the initial password from stdin.')
		configuration.option('reset-token-hash').valueRequired().description('Hex encoded sha256 of a password reset token to store for the person.')
		configuration.option('reset-token-hash-env').valueRequired().description('Read the password reset token hash from the named environment variable.')
		configuration.option('reset-token-hash-stdin').valueNone().description('Read the password reset token hash from stdin.')
		configureMembershipOptions(configuration)
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const projectSlug = requireOptionValue(input.getOption('project'), 'project')
		const email = requireOptionValue(input.getOption('email'), 'email')
		const passwordFromStdin = input.getOption('password-stdin') === true
		const resetTokenHashFromStdin = input.getOption('reset-token-hash-stdin') === true
		if (input.getOption('memberships-stdin') === true && (passwordFromStdin || resetTokenHashFromStdin)) {
			throw new CliError('Only one value can consume stdin. Combine --memberships-stdin with an environment-backed credential instead.', {
				code: 'AMBIGUOUS_STDIN_INPUT',
				exitCode: ExitCode.InputError,
			})
		}
		const memberships = await resolveMemberships(readMembershipInputSource(input), this.readStdin)
		const credentialSources: TenantInputSource<'password' | 'reset-token-hash'>[] = []
		const password = input.getOption('password')
		const passwordEnv = input.getOption('password-env')
		const resetTokenHash = input.getOption('reset-token-hash')
		const resetTokenHashEnv = input.getOption('reset-token-hash-env')
		if (password !== undefined) {
			credentialSources.push(literalInput('password', '--password', password))
		}
		if (passwordEnv !== undefined) {
			credentialSources.push(environmentInput('password', '--password-env', passwordEnv))
		}
		if (passwordFromStdin) {
			credentialSources.push(stdinInput('password', '--password-stdin'))
		}
		if (resetTokenHash !== undefined) {
			credentialSources.push(literalInput('reset-token-hash', '--reset-token-hash', resetTokenHash))
		}
		if (resetTokenHashEnv !== undefined) {
			credentialSources.push(environmentInput('reset-token-hash', '--reset-token-hash-env', resetTokenHashEnv))
		}
		if (resetTokenHashFromStdin) {
			credentialSources.push(stdinInput('reset-token-hash', '--reset-token-hash-stdin'))
		}
		const credential = await resolveRequiredTenantInput(credentialSources, { label: 'unmanaged invite credential' }, {
			readStdin: this.readStdin,
			readEnvironment: name => this.env[name],
		})
		const credentialValue = credential.kind === 'stdin' ? removeOneTrailingLineEnding(credential.value) : credential.value
		if (credentialValue === '') {
			throw new CliError('The selected unmanaged invite credential source resolved to an empty value.', {
				code: 'EMPTY_INPUT_VALUE',
				exitCode: ExitCode.InputError,
			})
		}
		if (credential.name === 'reset-token-hash' && !/^[0-9a-f]{64}$/.test(credentialValue)) {
			throw new CliError('The password reset token hash must be a 64-character hexadecimal SHA-256 hash.', {
				code: 'INVALID_RESET_TOKEN_HASH',
				exitCode: ExitCode.InputError,
			})
		}

		output.info(`Creating an unmanaged membership for ${email} in project ${projectSlug} as ${formatMemberships(memberships)}`)
		const result = await this.tenantClientProvider.member().unmanagedInvite({
			projectSlug,
			email,
			memberships,
			options: credential.name === 'password'
				? { password: credentialValue }
				: { resetTokenHash: credentialValue },
		})

		output.data(
			{ projectSlug, ...result },
			{
				human: it =>
					it.isNew
						? `Created ${humanText(it.email ?? email)} in ${humanText(it.projectSlug)}. Identity: ${humanText(it.identityId)}`
						: `${humanText(it.email ?? email)} already existed and was added to ${humanText(it.projectSlug)}. Identity: ${humanText(it.identityId)}`,
				quiet: it => it.identityId,
			},
		)
	}
}

const removeOneTrailingLineEnding = (value: string): string => value.replace(/(?:\r\n|\n)$/, '')
