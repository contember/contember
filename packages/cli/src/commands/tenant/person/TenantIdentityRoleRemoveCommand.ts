import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { requireConfirmation } from '../../../lib/tenant/confirmation.js'
import { humanText } from '../tenantOutput.js'

type Args = {
	identityId: string
	role: string[]
}

type Options = {
	yes?: boolean
}

interface IdentityRolesResult {
	identityId: string
	removed: string[]
	/** All global roles of the identity after the change, or null when the token may not read them. */
	roles: string[] | null
}

export class TenantIdentityRoleRemoveCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Revoke global (project-independent) roles from an identity.')
		configuration.argument('identityId').description('Identity id, as listed by "tenant person list".')
		configuration.argument('role').variadic().description('One or more global roles to revoke.')
		configuration.option('yes').valueNone().description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const identityId = input.getArgument('identityId')
		const removed = input.getArgument('role')

		await requireConfirmation({
			yes: input.getOption('yes') === true,
			output,
			warning: `This will revoke ${removed.join(', ')} from identity ${identityId}, which may lock it out of the API.`,
		})

		const roles = await this.tenantClientProvider.person().removeGlobalIdentityRoles(identityId, removed)

		output.info(`Revoked ${removed.join(', ')} from identity ${identityId}.`)
		output.data<IdentityRolesResult>(
			{ identityId, removed, roles },
			{ human: it => it.roles === null ? humanText(it.identityId) : it.roles.map(humanText).join(', '), quiet: it => it.identityId },
		)
	}
}
