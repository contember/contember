import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { Input } from '../cli/Input'
import { createInstance, validateInstanceName } from '../utils/instance'

type Args = {
	instanceName: string
}

type Options = {}

export class InstanceCreateCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Creates a new Contember instance')
		configuration.argument('instanceName')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const [instanceName] = [input.getArgument('instanceName')]
		validateInstanceName(instanceName)
		const workspaceDirectory = process.cwd()

		await createInstance({ workspaceDirectory, instanceName })
		console.log(`Instance ${instanceName} created.`)
	}
}
