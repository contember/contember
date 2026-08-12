import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import type { InviteMethod } from '@contember/graphql-client-tenant'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { formatMemberships, requireOptionValue } from './memberOptions.js'
import { configureMembershipOptions, MembershipOptions, readMembershipInputSource, resolveMemberships } from './membershipInput.js'
import { readStdinText, StdinReader } from '../../../lib/tenant/stdin.js'
import { humanText } from '../tenantOutput.js'

type Args = {}

type Options = MembershipOptions & {
	project?: string
	email?: string
	name?: string
	method?: string
	['mail-variant']?: string
}

const inviteMethods: InviteMethod[] = ['CREATE_PASSWORD', 'RESET_PASSWORD']

/**
 * `tenant member invite`
 *
 * The mail-sending half of the invite pair. `tenant member invite-unmanaged` is a separate command rather
 * than a flag here: the two mutations share no options at all (mail method and variant versus a password
 * or a reset token hash), and only one of them handles a secret.
 */
export class TenantMemberInviteCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdin: StdinReader = readStdinText,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Invite a person to a project by e-mail')
		configuration.option('project').valueRequired().required().description('Project slug.')
		configuration.option('email').valueRequired().required().description('E-mail address of the invited person.')
		configuration.option('name').valueRequired().description('Name of the invited person. Used only when the person does not exist yet.')
		configuration.option('method').valueRequired().description(
			`How the person gets their credentials: ${inviteMethods.join(' or ')} (default ${inviteMethods[0]}).`,
		)
		configuration.option('mail-variant').valueRequired().description('Mail template variant to use.')
		configureMembershipOptions(configuration)
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const projectSlug = requireOptionValue(input.getOption('project'), 'project')
		const email = requireOptionValue(input.getOption('email'), 'email')
		const memberships = await resolveMemberships(readMembershipInputSource(input), this.readStdin)

		output.info(`Inviting ${email} to project ${projectSlug} as ${formatMemberships(memberships)}`)
		const result = await this.tenantClientProvider.member().invite({
			projectSlug,
			email,
			name: input.getOption('name'),
			memberships,
			options: { method: parseInviteMethod(input.getOption('method')), mailVariant: input.getOption('mail-variant') },
		})

		output.data(
			{ projectSlug, ...result },
			{
				human: it =>
					it.isNew
						? `Invited ${humanText(it.email ?? email)} to ${humanText(it.projectSlug)}. Identity: ${humanText(it.identityId)}`
						: `${humanText(it.email ?? email)} already existed and was added to ${humanText(it.projectSlug)}. Identity: ${humanText(it.identityId)}`,
				quiet: it => it.identityId,
			},
		)
	}
}

const parseInviteMethod = (value: string | undefined): InviteMethod | undefined => {
	if (value === undefined) {
		return undefined
	}
	const method = inviteMethods.find(it => it === value.toUpperCase())
	if (method === undefined) {
		throw new CliError(`Option --method must be one of ${inviteMethods.join(', ')}, got "${value}".`, {
			code: 'INVALID_INPUT',
			exitCode: ExitCode.InputError,
		})
	}
	return method
}
