import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { formatMemberships, requireOptionValue } from './memberOptions.js'
import { configureMembershipOptions, MembershipOptions, readMembershipInputSource, resolveMemberships } from './membershipInput.js'
import { readStdinText, StdinReader } from '../../../lib/tenant/stdin.js'
import { requireConfirmation } from '../../../lib/tenant/confirmation.js'
import { humanText } from '../tenantOutput.js'

type Args = {}

type Options = MembershipOptions & {
	project?: string
	identity?: string
	yes?: boolean
}

/** `tenant member update` */
export class TenantMemberUpdateCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdin: StdinReader = readStdinText,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Replace the memberships of an existing project member')
		configuration.option('project').valueRequired().required().description('Project slug.')
		configuration.option('identity').valueRequired().required().description('Identity id of the member.')
		configuration.option('yes').valueNone().description('Confirm replacing the membership list with an empty list.')
		configureMembershipOptions(configuration)
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const projectSlug = requireOptionValue(input.getOption('project'), 'project')
		const identityId = requireOptionValue(input.getOption('identity'), 'identity')
		const memberships = await resolveMemberships(readMembershipInputSource(input), this.readStdin)
		if (memberships.length === 0) {
			await requireConfirmation({
				yes: input.getOption('yes') === true,
				output,
				warning: `This will remove every membership of identity ${identityId} in project ${projectSlug}.`,
			})
		}

		// the mutation replaces the whole list, so anything the caller omits is dropped
		output.info(`Replacing the memberships of identity ${identityId} in project ${projectSlug} with ${formatMemberships(memberships)}`)
		await this.tenantClientProvider.member().updateProjectMember(projectSlug, identityId, memberships)

		output.data(
			{ projectSlug, identityId, memberships },
			{
				human: it => `Identity ${humanText(it.identityId)} in ${humanText(it.projectSlug)} now has: ${formatMemberships(it.memberships)}`,
				quiet: it => it.identityId,
			},
		)
	}
}
