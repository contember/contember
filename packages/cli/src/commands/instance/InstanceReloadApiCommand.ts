import { Command, CommandConfiguration, Input } from '../../cli'
import { resolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { DockerCompose } from '../../utils/dockerCompose'
import { Workspace } from '../../utils/Workspace'

type Args = {
	instanceName?: string
}

type Options = {}

export class InstanceReloadApiCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Reloads Contember API')
		configuration.argument('instanceName').optional()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const workspace = await Workspace.get(process.cwd())
		const { directory } = await resolveInstanceEnvironmentFromInput({ input, workspace })
		const dockerCompose = new DockerCompose(directory)
		await dockerCompose.run(['up', '-d', '--no-deps', '--force-recreate', 'api']).output
	}
}
