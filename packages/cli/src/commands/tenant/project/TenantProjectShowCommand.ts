import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'

type Args = {
	slug: string
}
type Options = {}

export class TenantProjectShowCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Show a project by slug')
		configuration.argument('slug').description('Project slug')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const slug = input.getArgument('slug')
		const project = await this.tenantClientProvider.project().getProjectBySlug(slug)
		if (!project) {
			throw new CliError(`Project "${slug}" not found.`, { code: 'PROJECT_NOT_FOUND', exitCode: ExitCode.NotFound })
		}
		output.data(project, { quiet: it => it.slug })
	}
}
