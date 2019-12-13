import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { Input } from '../cli/Input'
import {
	printInstanceStatus,
	resolveInstanceDockerConfig,
	resolveInstanceEnvironmentFromInput,
} from '../utils/instance'
import { execDockerCompose } from '../utils/dockerCompose'
import { dump } from 'js-yaml'
import { ChildProcessError } from '../utils/commands'

type Args = {
	instanceName?: string
}

type Options = {}

export class InstanceValidateConfigCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Show status of local Contember instance')
		configuration.argument('instanceName').optional()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput(input)
		const config = await resolveInstanceDockerConfig({ instanceDirectory })
		const configYaml = dump(config)
		try {
			await execDockerCompose(
				['-f', '-', 'run', '--no-deps', '--rm', 'api', 'node', './dist/src/start.js', 'validate'],
				{
					cwd: instanceDirectory,
					stdin: configYaml,
				},
			)
			console.log('Configuration is valid')
		} catch (e) {
			if (e instanceof ChildProcessError) {
				console.log('Configuration is NOT valid')
			} else {
				throw new e()
			}
		}
	}
}
