import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { Input } from '../cli/Input'
import { resolveInstanceDockerConfig, resolveInstanceEnvironmentFromInput } from '../utils/instance'
import { runDockerCompose } from '../utils/dockerCompose'
import { dump } from 'js-yaml'
import { ChildProcess } from 'child_process'

type Args = {
	instanceName: string
}

type Options = {}

export class InstanceLogsCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Show Contember instance logs')
		configuration.argument('instanceName').optional()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput(input)
		const config = await resolveInstanceDockerConfig({ instanceDirectory })

		const configYaml = dump(config)
		let logsProcess: ChildProcess
		process.on('SIGINT', async signal => {
			if (logsProcess) {
				logsProcess.kill(signal)
			}
			process.exit(0)
		})

		logsProcess = await runDockerCompose(['-f', '-', 'logs', '-f'], {
			cwd: instanceDirectory,
			stdin: configYaml,
		}).child

		process.stdin.resume()
		await new Promise(resolve => {
			process.stdin.on('exit', resolve)
		})
	}
}
