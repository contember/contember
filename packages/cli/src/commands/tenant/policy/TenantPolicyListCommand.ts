import { Command, CommandConfiguration, Input, Output, OutputTableColumn } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { RemoteAuthPolicy } from '../../../lib/tenant/clients/index.js'
import { humanText } from '../tenantOutput.js'

type Args = {}
type Options = {}

const columns: OutputTableColumn<RemoteAuthPolicy>[] = [
	{ field: 'id', name: 'ID' },
	{ field: 'scope', name: 'Scope' },
	{ field: 'project', name: 'Project' },
	{ field: 'roles', name: 'Roles', format: value => value.map(humanText).join(', ') },
	{ field: 'mfaRequired', name: 'MFA required' },
	{ field: 'tokenExpiration', name: 'Token expiration' },
	{ field: 'idleTimeout', name: 'Idle timeout' },
	{ field: 'mfaGraceDuration', name: 'MFA grace' },
	{ field: 'rememberMeAllowed', name: 'Remember me' },
]

export class TenantPolicyListCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('List the configured auth policies (per-role MFA and session policy).')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const policies = await this.tenantClientProvider.policy().listAuthPolicies()
		output.table(columns, policies, 'id')
		if (policies.length === 0) {
			output.info('No auth policies are configured. MFA enforcement is inert.')
		}
	}
}
