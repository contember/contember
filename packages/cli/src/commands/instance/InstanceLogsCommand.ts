import { Command, CommandConfiguration, Input } from '../../cli'
import { resolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { DockerCompose } from '../../utils/dockerCompose'

type Args = {
	instanceName: string
}

type Options = {
	tail: string | true
}

export class InstanceLogsCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Show Contember instance logs')
		configuration.argument('instanceName').optional()
		configuration.option('tail').valueOptional()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const workspaceDirectory = process.cwd()
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput({ input, workspaceDirectory })
		const dockerCompose = new DockerCompose(instanceDirectory)
		const tail = input.getOption('tail')
		await dockerCompose.run(['logs', '-f', '--tail', tail === true ? '0' : tail ?? 'all']).output
	}
}
