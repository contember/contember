import { Command, CommandConfiguration, Input } from '../../cli'
import { resolveInstanceDockerConfig, resolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { DockerCompose } from '../../utils/dockerCompose'

type Args = {
	instanceName?: string
}

type Options = {}

export class InstanceStopCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Stops local Contember instance')
		configuration.argument('instanceName').optional()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput(input)
		const { composeConfig } = await resolveInstanceDockerConfig({ instanceDirectory })
		const dockerCompose = new DockerCompose(instanceDirectory, composeConfig)
		await dockerCompose.run(['down']).output
	}
}
