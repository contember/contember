import { Command, CommandConfiguration, Input } from '../../cli'
import { resolveInstanceEnvironmentFromInput, updateInstanceOverrideConfig } from '../../utils/instance'

type Args = {
	instanceName: string
}

type Options = {
	['ports']?: string
	host?: string[]
}

export class InstanceConfigureCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Configures Contember instance by creating and/or updating local configs.')
		configuration.argument('instanceName').optional()
		configuration.option('host').valueArray()
		configuration.option('ports').valueRequired()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const workspaceDirectory = process.cwd()
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput({ input, workspaceDirectory })
		await updateInstanceOverrideConfig({
			instanceDirectory,
			host: input.getOption('host'),
			startPort: input.getOption('ports') ? Number(input.getOption('ports')) : undefined,
		})
	}
}
