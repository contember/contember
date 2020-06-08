import { Command, CommandConfiguration, Input } from '../../cli'
import { resolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { DockerCompose } from '../../utils/dockerCompose'

type Args = {
	instanceName?: string
}

type Options = {}

export class InstanceReloadAdminCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Reloads Contember admin')
		configuration.argument('instanceName').optional()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const workspaceDirectory = process.cwd()
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput({ input, workspaceDirectory })
		const dockerCompose = new DockerCompose(instanceDirectory)
		await dockerCompose.run(['up', '-d', '--no-deps', '--force-recreate', 'admin']).output
	}
}
