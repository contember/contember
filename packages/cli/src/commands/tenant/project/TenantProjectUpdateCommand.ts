import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { resolveJsonConfigOption } from './jsonConfigOption.js'
import { readStdinText, type StdinReader } from '../../../lib/tenant/stdin.js'
import { humanText, requireNonEmptyTenantName } from '../tenantOutput.js'

type Args = {
	slug: string
}
type Options = {
	name?: string
	config?: string
	['config-stdin']?: boolean
	['merge-config']?: boolean
}

export class TenantProjectUpdateCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdinFn: StdinReader = readStdinText,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description(`Update a project's name and/or config`)
		configuration.argument('slug').description('Project slug')
		configuration.option('name').valueRequired().description('New display name')
		configuration.option('config').valueRequired().description('New config as inline JSON — replaces the config unless --merge-config is set')
		configuration.option('config-stdin').valueNone().description('Read the new config as JSON from stdin, instead of --config')
		configuration.option('merge-config').valueNone().description('Merge the new config into the existing one instead of replacing it')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const slug = input.getArgument('slug')
		const name = requireNonEmptyTenantName(input.getOption('name'), 'Project')
		const configOption = input.getOption('config')
		const configFromStdin = input.getOption('config-stdin') === true
		const configProvided = configOption !== undefined || configFromStdin
		const mergeConfig = input.getOption('merge-config') === true

		if (mergeConfig && !configProvided) {
			throw new CliError('--merge-config requires --config or --config-stdin.', {
				code: 'MERGE_CONFIG_WITHOUT_CONFIG',
				exitCode: ExitCode.InputError,
			})
		}
		if (name === undefined && !configProvided) {
			throw new CliError('Nothing to update: pass --name and/or --config.', { code: 'NO_UPDATE_FIELDS', exitCode: ExitCode.InputError })
		}
		const config = await resolveJsonConfigOption(configOption, configFromStdin, this.readStdinFn)

		await this.tenantClientProvider.project().updateProject(slug, {
			name,
			config,
			mergeConfig: configProvided ? mergeConfig : undefined,
		})
		output.data(
			{ slug, name: name ?? null, config: config ?? null, mergeConfig: configProvided ? mergeConfig : null },
			{
				human: it => `Project "${humanText(it.slug)}" updated.`,
				quiet: it => it.slug,
			},
		)
	}
}
