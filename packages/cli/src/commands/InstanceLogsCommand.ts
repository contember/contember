import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { Input } from '../cli/Input'
import { resolveInstanceDockerConfig, resolveInstanceEnvironmentFromInput } from '../utils/instance'
import { DockerCompose, runDockerCompose } from '../utils/dockerCompose'
import { dump } from 'js-yaml'
import { ChildProcess } from 'child_process'

type Args = {
	instanceName: string
}

type Options = {}

export class InstanceLogsCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Show Contember instance logs')
		configuration.argument('instanceName').optional()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput(input)
		const { composeConfig } = await resolveInstanceDockerConfig({ instanceDirectory })
		const dockerCompose = new DockerCompose(instanceDirectory, composeConfig)

		await dockerCompose.run(['logs', '-f']).output
	}
}
