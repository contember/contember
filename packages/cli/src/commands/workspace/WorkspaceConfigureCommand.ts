import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { interactiveInstanceConfigure } from '../../utils/instance'
import { readDefaultDockerComposeConfig, Workspace } from '@contember/cli-common'

type Args = {}

type Options = {
	['ports']?: string
	host?: string[]
}

export class WorkspaceConfigureCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Configures Contember workspace ports.')
		configuration.option('host').valueArray()
		configuration.option('ports').valueRequired()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		if (!process.stdin.isTTY) {
			throw 'TTY is required'
		}
		const workspace = await Workspace.get(process.cwd())
		const composeConfig = await readDefaultDockerComposeConfig(workspace.directory)
		if (!composeConfig.services) {
			throw 'docker-compose is not configured'
		}
		await interactiveInstanceConfigure({
			composeConfig,
			workspace,
			host: input.getOption('host'),
			ports: input.getOption('ports') ? Number(input.getOption('ports')) : undefined,
		})
		console.log('Workspace configured. Check corresponding docker-compose.override.yaml for details.')
	}
}
