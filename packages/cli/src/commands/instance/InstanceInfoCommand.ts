import { Command, CommandConfiguration, Input } from '../../cli'
import { printInstanceStatus, resolveInstanceEnvironmentFromInput } from '../../utils/instance'

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
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput(input)

		await printInstanceStatus({ instanceDirectory })
	}
}
