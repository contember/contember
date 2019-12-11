import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { Input } from '../cli/Input'
import {
	getInstanceStatus,
	printInstanceStatus,
	resolveInstanceDockerConfig,
	resolveInstanceEnvironmentFromInput,
} from '../utils/instance'
import { execDockerCompose, updateOverrideConfig } from '../utils/dockerCompose'
import { dump } from 'js-yaml'
import { interactiveSetup } from '../utils/setup'

type Args = {
	instanceName: string
}

type Options = {
	// ['host']: string
}

export class InstanceStartCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Starts Contember instance')
		configuration.argument('instanceName').optional()
		// @todo
		// configuration.option('host').valueRequired()
		// @todo node vs docker
		// configuration.option('admin-runtime').valueRequired()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput(input)
		const config = await resolveInstanceDockerConfig({ instanceDirectory })

		const configYaml = dump(config)
		process.on('SIGINT', async () => {
			await execDockerCompose(['-f', '-', 'down'], {
				cwd: instanceDirectory,
				stdin: configYaml,
			})
			process.exit(0)
		})

		await execDockerCompose(['-f', '-', 'pull', 'api'], {
			cwd: instanceDirectory,
			stdin: configYaml,
		})

		await execDockerCompose(['-f', '-', 'up', '-d'], {
			cwd: instanceDirectory,
			stdin: configYaml,
		})

		await new Promise(resolve => setTimeout(resolve, 2000))

		const status = await getInstanceStatus({ instanceDirectory })
		const notRunning = status.filter(it => !it.running)
		if (notRunning.length > 0) {
			const notRunningNames = notRunning.map(it => it.name)
			console.error(`Following services failed to start: ${notRunningNames.join(', ')}`)
			await execDockerCompose(['-f', '-', 'logs', ...notRunningNames], {
				cwd: instanceDirectory,
				stdin: configYaml,
			})
			return
		}

		if (!config.services.admin.environment.CONTEMBER_LOGIN_TOKEN) {
			console.log('It seems that this is first run of this instance. Will try to execute a setup.')
			console.log('If that is not true, please fill your login token to a docker-compose.override.yaml')

			const { loginToken } = await interactiveSetup(config.services.admin.environment.CONTEMBER_API_SERVER)
			console.log('Superadmin account created.')

			await updateOverrideConfig(instanceDirectory, (config, { merge }) =>
				merge(config, {
					version: '3.7',
					services: { admin: { environment: { CONTEMBER_LOGIN_TOKEN: loginToken } } },
				}),
			)

			config.services.admin.environment.CONTEMBER_LOGIN_TOKEN = loginToken
			console.log('Login token and saved to your docker-compose.override.yaml: ' + loginToken)

			await execDockerCompose(['-f', '-', 'up', '-d', 'admin'], {
				cwd: instanceDirectory,
				stdin: dump(config),
			})
		}

		await printInstanceStatus({ instanceDirectory })
		process.stdin.resume()

		await new Promise(resolve => {
			process.stdin.on('exit', resolve)
		})
	}
}
