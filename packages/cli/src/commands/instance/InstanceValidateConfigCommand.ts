import { Command, CommandConfiguration, Input } from '../../cli'
import { resolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { DockerCompose } from '../../utils/dockerCompose'
import { ChildProcessError } from '../../utils/commands'

type Args = {
	instanceName?: string
}

type Options = {}

export class InstanceValidateConfigCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Validates configuration of Contember instance')
		configuration.argument('instanceName').optional()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const workspaceDirectory = process.cwd()
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput({ input, workspaceDirectory })
		try {
			const dockerCompose = new DockerCompose(instanceDirectory)

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
