import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { Input } from '../cli/Input'
import { resolveInstanceDockerConfig, resolveInstanceEnvironmentFromInput } from '../utils/instance'
import { DockerCompose } from '../utils/dockerCompose'
import { ChildProcessError } from '../utils/commands'

type Args = {
	instanceName?: string
}

type Options = {}

export class InstanceValidateConfigCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Validates configuration of Contember instance')
		configuration.argument('instanceName').optional()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput(input)
		const { composeConfig } = await resolveInstanceDockerConfig({ instanceDirectory })
		try {
			const dockerCompose = new DockerCompose(instanceDirectory, composeConfig)

			await dockerCompose.run(['run', '--no-deps', '--rm', 'api', 'node', './dist/src/start.js', 'validate']).output
			console.log('Configuration is valid')
		} catch (e) {
			if (e instanceof ChildProcessError) {
				console.log('Configuration is NOT valid')
			} else {
				throw e
			}
		}
	}
}
