import { Command, CommandConfiguration, Input } from '../../cli'
import { resolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { Workspace } from '../../utils/Workspace'
import { printContainersStatus } from '../../utils/docker'

type Args = {
	instanceName?: string
}

type Options = {}

export class InstanceInfoCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Show status of local Contember instance')
		configuration.argument('instanceName').optional()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const workspace = await Workspace.get(process.cwd())
		const instance = await resolveInstanceEnvironmentFromInput({ input, workspace })
		printContainersStatus(await instance.getStatus())
	}
}
