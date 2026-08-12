import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { TenantProjectSummary } from '../../../lib/tenant/clients/TenantProjectClient.js'

type Args = {}
type Options = {}

export class TenantProjectListCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('List projects on the tenant')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const projects = await this.tenantClientProvider.project().listProjects()
		output.table<TenantProjectSummary>(
			[{ field: 'id', name: 'ID' }, { field: 'name', name: 'Name' }, { field: 'slug', name: 'Slug' }],
			projects,
			'slug',
		)
	}
}
