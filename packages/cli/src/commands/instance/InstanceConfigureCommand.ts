import { Command, CommandConfiguration, Input } from '../../cli'
import { interactiveInstanceConfigure, resolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { readDefaultDockerComposeConfig } from '../../utils/dockerCompose'
import { Workspace } from '../../utils/Workspace'

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
		if (!process.stdin.isTTY) {
			throw 'TTY is required'
		}
		const workspace = await Workspace.get(process.cwd())
		const instance = await resolveInstanceEnvironmentFromInput({ input, workspace })
		const composeConfig = await readDefaultDockerComposeConfig(instance.directory)
		if (!composeConfig.services) {
			throw 'docker-compose is not configured'
		}
		await interactiveInstanceConfigure({
			composeConfig,
			instance,
			host: input.getOption('host'),
			ports: input.getOption('ports') ? Number(input.getOption('ports')) : undefined,
		})
		console.log('Instance configured. Check corresponding docker-compose.override.yaml for details.')
	}
}
