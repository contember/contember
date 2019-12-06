import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { Input } from '../cli/Input'
import { resolveInstanceDockerConfig, resolveInstanceEnvironmentFromInput } from '../utils/instance'
import { execDockerCompose } from '../utils/dockerCompose'
import { dump } from 'js-yaml'

type Args = {
	instanceName?: string
}

type Options = {}

export class InstanceReloadApiCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Reloads Contember API')
		configuration.argument('instanceName').optional()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput(input)
		const config = await resolveInstanceDockerConfig({ instanceDirectory })
		const configYaml = dump(config)
		await execDockerCompose(['-f', '-', 'up', '-d', '--no-deps', '--force-recreate', 'api'], {
			cwd: instanceDirectory,
			stdin: configYaml,
		})
	}
}
