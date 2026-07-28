import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver.js'
import { TenantClient } from '../../lib/tenant/TenantClient.js'
import { TenantConfigLoader } from '../../lib/tenant/TenantConfigLoader.js'
import { TenantConfigApplier } from '../../lib/tenant/TenantConfigApplier.js'

type Args = {
	config?: string
}

type Options = {
	dsn?: string
	['dry-run']?: boolean
}

const DEFAULT_CONFIG_PATH = 'tenant.config.ts'

export class TenantApplyCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
		private readonly tenantConfigLoader: TenantConfigLoader,
		private readonly tenantConfigApplier: TenantConfigApplier,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Apply declarative tenant configuration (global config, identity providers, mail templates, custom roles)')
		configuration.argument('config').optional().description(`Path to the tenant config file (default: ${DEFAULT_CONFIG_PATH})`)
		configuration.option('dsn').valueRequired().description('Project DSN. Falls back to CONTEMBER_* environment variables.')
		configuration.option('dry-run').valueNone().description('Print the actions that would be performed without executing them.')
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const configPath = input.getArgument('config') ?? DEFAULT_CONFIG_PATH
		const dsn = input.getOption('dsn')
		const dryRun = input.getOption('dry-run') === true

		const remoteProject = this.remoteProjectResolver.resolve(dsn)
		if (!remoteProject) {
			throw `Project not defined. Please provide a DSN (--dsn) or set CONTEMBER_* environment variables.`
		}

		const config = await this.tenantConfigLoader.loadConfig(configPath)
		const client = TenantClient.create(remoteProject.endpoint, remoteProject.token)

		console.log(`Applying tenant config from ${configPath}`)
		console.log(`API URL: ${remoteProject.endpoint}`)
		console.log('')

		await this.tenantConfigApplier.apply(client, config, { dryRun })

		console.log('')
		console.log(dryRun ? 'Dry run complete. No changes were made.' : 'Tenant configuration applied.')
		return 0
	}
}
