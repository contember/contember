import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { humanText } from '../tenantOutput.js'

type Args = {
	identityId: string
	role: string[]
}

type Options = {}

interface IdentityRolesResult {
	identityId: string
	added: string[]
	/** All global roles of the identity after the change, or null when the token may not read them. */
	roles: string[] | null
}

export class TenantIdentityRoleAddCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Grant global (project-independent) roles to an identity.')
		configuration.argument('identityId').description('Identity id, as listed by "tenant person list".')
		configuration.argument('role').variadic().description('One or more global roles to grant.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const identityId = input.getArgument('identityId')
		const added = input.getArgument('role')

		const roles = await this.tenantClientProvider.person().addGlobalIdentityRoles(identityId, added)

		output.info(`Granted ${added.join(', ')} to identity ${identityId}.`)
		output.data<IdentityRolesResult>(
			{ identityId, added, roles },
			{ human: it => it.roles === null ? humanText(it.identityId) : it.roles.map(humanText).join(', '), quiet: it => it.identityId },
		)
	}
}
