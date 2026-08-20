import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { resolveJsonConfigOption } from './jsonConfigOption.js'
import { readStdinText, type StdinReader } from '../../../lib/tenant/stdin.js'
import { assertGeneratedTenantToken, assertTenantCredentialContract, humanText, requireNonEmptyTenantName } from '../tenantOutput.js'

type Args = {
	slug: string
}
type Options = {
	name?: string
	config?: string
	['config-stdin']?: boolean
	['if-not-exists']?: boolean
	['no-deploy-token']?: boolean
}

export class TenantProjectCreateCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdinFn: StdinReader = readStdinText,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Create a project')
		configuration.argument('slug').description('Project slug')
		configuration.option('name').valueRequired().description('Project display name (defaults to the slug on the server)')
		configuration.option('config').valueRequired().description('Initial config as inline JSON')
		configuration.option('config-stdin').valueNone().description('Read the initial config as JSON from stdin, instead of --config')
		configuration.option('if-not-exists').valueNone().description('Do not fail if the project already exists')
		configuration.option('no-deploy-token').valueNone().description('Skip issuing a deploy API key for the project')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const slug = input.getArgument('slug')
		const name = requireNonEmptyTenantName(input.getOption('name'), 'Project')
		const config = await resolveJsonConfigOption(input.getOption('config'), input.getOption('config-stdin') === true, this.readStdinFn)
		const ifNotExists = input.getOption('if-not-exists') === true
		const noDeployToken = input.getOption('no-deploy-token') === true

		const result = await this.tenantClientProvider.project().createProject(slug, ifNotExists, { name, config, noDeployToken })
		const created = result !== null
		const data = { slug, created, deployerApiKey: result?.deployerApiKey ?? null }
		if (result !== null) {
			assertTenantCredentialContract(
				noDeployToken ? result.deployerApiKey === null : result.deployerApiKey?.token !== null && result.deployerApiKey?.token !== undefined,
				'deployer',
			)
		}
		const generatedToken = data.deployerApiKey?.token === null || data.deployerApiKey?.token === undefined
			? null
			: assertGeneratedTenantToken(data.deployerApiKey.token, 'deployer')
		if (data.deployerApiKey?.token !== null && data.deployerApiKey?.token !== undefined) {
			output.warn('The deployer token is shown exactly once and cannot be retrieved again. Store it now.')
		}
		output.data(data, {
			human: it => {
				const safeSlug = humanText(it.slug)
				const status = it.created ? `Project "${safeSlug}" created.` : `Project "${safeSlug}" already exists.`
				return generatedToken === null ? status : `${status}\nDeployer token: ${generatedToken}`
			},
			quiet: it => generatedToken ?? it.slug,
		})
	}
}
