import { Command, CommandConfiguration, Input } from '../../cli'
import { resolveInstanceDockerConfig, resolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { DockerCompose } from '../../utils/dockerCompose'
import { getWorkspaceApiVersion } from '../../utils/workspace'

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
		const workspaceDirectory = process.cwd()
		const version = await getWorkspaceApiVersion({ workspaceDirectory })
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput({ input, workspaceDirectory })
		const { composeConfig } = await resolveInstanceDockerConfig({ instanceDirectory })
		const dockerCompose = new DockerCompose(instanceDirectory, composeConfig, {
			env: {
				CONTEMBER_VERSION: version || '0',
			},
		})
		await dockerCompose.run(['up', '-d', '--no-deps', '--force-recreate', 'api']).output
	}
}
