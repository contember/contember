import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { requireConfirmation } from '../../../lib/tenant/confirmation.js'
import { humanText } from '../tenantOutput.js'
import { requireOptionValue } from './memberOptions.js'

type Args = {}

type Options = {
	project?: string
	identity?: string
	yes?: boolean
}

/** `tenant member remove` */
export class TenantMemberRemoveCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Remove an identity from a project')
		configuration.option('project').valueRequired().required().description('Project slug.')
		configuration.option('identity').valueRequired().required().description('Identity id of the member to remove.')
		configuration.option('yes').valueNone().description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<number | void> {
		const projectSlug = requireOptionValue(input.getOption('project'), 'project')
		const identityId = requireOptionValue(input.getOption('identity'), 'identity')

		await requireConfirmation({
			yes: input.getOption('yes') === true,
			output,
			warning: `Identity ${identityId} will lose all its memberships in project ${projectSlug}.`,
		})

		output.info(`Removing identity ${identityId} from project ${projectSlug}`)
		await this.tenantClientProvider.member().removeProjectMember(projectSlug, identityId)

		output.data(
			{ projectSlug, identityId, removed: true },
			{ human: it => `Identity ${humanText(it.identityId)} was removed from ${humanText(it.projectSlug)}.`, quiet: it => it.identityId },
		)
	}
}
