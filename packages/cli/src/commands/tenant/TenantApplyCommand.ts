import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver.js'
import { TenantApiTransport } from '../../lib/tenant/TenantApiTransport.js'
import { createTenantClients } from '../../lib/tenant/clients/index.js'
import { TenantConfigLoader } from '../../lib/tenant/TenantConfigLoader.js'
import { TenantConfigAction, TenantConfigApplier, TenantConfigWarning } from '../../lib/tenant/TenantConfigApplier.js'
import { humanText } from './tenantOutput.js'

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
		configuration.description('Apply declarative tenant configuration (global config, identity providers, mail templates)')
		configuration.argument('config').optional().description(`Path to the tenant config file (default: ${DEFAULT_CONFIG_PATH})`)
		configuration.option('dsn').valueRequired().description('Project DSN. Falls back to CONTEMBER_* environment variables.')
		configuration.option('dry-run').valueNone().description('Print the actions that would be performed without executing them.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const configPath = input.getArgument('config') ?? DEFAULT_CONFIG_PATH
		const dsn = input.getOption('dsn')
		const dryRun = input.getOption('dry-run') === true

		const remoteProject = this.remoteProjectResolver.resolve(dsn)
		if (!remoteProject) {
			throw new CliError('Project not defined. Please provide a DSN (--dsn) or set CONTEMBER_* environment variables.', {
				code: 'PROJECT_NOT_DEFINED',
				exitCode: ExitCode.InputError,
			})
		}

		const config = await this.tenantConfigLoader.loadConfig(configPath)
		const clients = createTenantClients(TenantApiTransport.create(remoteProject.endpoint, remoteProject.token))

		output.info(`Applying tenant config from ${configPath}`)
		output.info(`API URL: ${remoteProject.endpoint}`)

		const { actions, warnings } = await this.tenantConfigApplier.apply(clients, config, { dryRun })

		const result: TenantConfigApplyResult = { configPath, dryRun, actions, warnings }
		output.data(result, {
			human: renderApplyResult,
			// deliberately actions only: quiet is a scalar stream meant for piping, and the applier
			// already printed the warnings on stderr wherever they are not suppressed
			quiet: value => value.actions.map(formatAction),
		})

		if (actions.length === 0) {
			output.info('Nothing to apply, the config declares no actions.')
		} else {
			output.info(dryRun ? 'Dry run complete. No changes were made.' : 'Tenant configuration applied.')
		}
	}
}

export interface TenantConfigApplyResult {
	configPath: string
	dryRun: boolean
	actions: TenantConfigAction[]
	/** Reachable in `--json` only; `output.warn` writes nothing outside human mode. */
	warnings: TenantConfigWarning[]
}

const formatAction = (action: TenantConfigAction): string =>
	action.target === null ? humanText(action.action) : `${humanText(action.action)}:${humanText(action.target)}`

const renderApplyResult = (result: TenantConfigApplyResult): string => {
	if (result.actions.length === 0) {
		return 'No tenant configuration actions.'
	}
	return result.actions.map(formatAction).join('\n')
}
