import { Command, CommandConfiguration, Input } from '../../cli'
import { resolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { DockerCompose } from '../../utils/dockerCompose'
import { Workspace } from '../../utils/Workspace'

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
		const workspace = await Workspace.get(process.cwd())
		const { directory } = await resolveInstanceEnvironmentFromInput({ input, workspace })
		const dockerCompose = new DockerCompose(directory)
		const tail = input.getOption('tail')
		await dockerCompose.run(['logs', '-f', '--tail', tail === true ? '0' : tail ?? 'all']).output
	}
}
