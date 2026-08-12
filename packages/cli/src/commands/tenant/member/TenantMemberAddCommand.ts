import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { formatMemberships, requireOptionValue } from './memberOptions.js'
import { configureMembershipOptions, MembershipOptions, readMembershipInputSource, resolveMemberships } from './membershipInput.js'
import { readStdinText, StdinReader } from '../../../lib/tenant/stdin.js'
import { humanText } from '../tenantOutput.js'

type Args = {}

type Options = MembershipOptions & {
	project?: string
	identity?: string
}

/** `tenant member add` */
export class TenantMemberAddCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdin: StdinReader = readStdinText,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Add an existing identity to a project')
		configuration.option('project').valueRequired().required().description('Project slug.')
		configuration.option('identity').valueRequired().required().description('Identity id of the new member.')
		configureMembershipOptions(configuration)
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const projectSlug = requireOptionValue(input.getOption('project'), 'project')
		const identityId = requireOptionValue(input.getOption('identity'), 'identity')
		const memberships = await resolveMemberships(readMembershipInputSource(input), this.readStdin)

		// reported before the call so a CI log records the attempt even when the mutation fails
		output.info(`Adding identity ${identityId} to project ${projectSlug} as ${formatMemberships(memberships)}`)
		await this.tenantClientProvider.member().addProjectMember(projectSlug, identityId, memberships)

		output.data(
			{ projectSlug, identityId, memberships },
			{
				human: it => `Identity ${humanText(it.identityId)} is now a member of ${humanText(it.projectSlug)}: ${formatMemberships(it.memberships)}`,
				quiet: it => it.identityId,
			},
		)
	}
}
