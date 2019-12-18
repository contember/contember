import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { Input } from '../cli/Input'
import {
	getInstanceStatus,
	printInstanceStatus,
	resolveInstanceDockerConfig,
	resolveInstanceEnvironmentFromInput,
} from '../utils/instance'
import { execDockerCompose, runDockerCompose, updateOverrideConfig } from '../utils/dockerCompose'
import { dump } from 'js-yaml'
import { interactiveSetup } from '../utils/setup'
import { runCommand } from '../utils/commands'
import { ChildProcessWithoutNullStreams } from 'child_process'

type Args = {
	instanceName: string
}

type Options = {
	// ['host']: string
	['admin-runtime']: 'node' | 'docker'
}

export class InstanceStartCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Starts Contember instance')
		configuration.argument('instanceName').optional()
		// @todo
		// configuration.option('host').valueRequired()
		// @todo node vs docker
		configuration
			.option('admin-runtime')
			.valueRequired()
			.description('"docker" or "node"')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput(input)
		const config = await resolveInstanceDockerConfig({ instanceDirectory })
		const adminEnv = config.services.admin.environment

		const nodeAdminRuntime = input.getOption('admin-runtime') === 'node'
		if (nodeAdminRuntime) {
			delete config.services.admin
		}

		const configYaml = dump(config)
		const exit = async () => {
			await execDockerCompose(['-f', '-', 'down'], {
				cwd: instanceDirectory,
				stdin: configYaml,
				detached: true,
			})
			process.exit(0)
		}
		let terminating = false
		process.on('SIGINT', async () => {
			if (terminating) {
				return
			}
			terminating = true
			try {
				await exit()
			} catch (e) {
				console.error(e)
			}
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

		if (!adminEnv.CONTEMBER_LOGIN_TOKEN) {
			console.log('It seems that this is first run of this instance. Will try to execute a setup.')
			console.log('If that is not true, please fill your login token to a docker-compose.override.yaml')

			const { loginToken } = await interactiveSetup(adminEnv.CONTEMBER_API_SERVER)
			console.log('Superadmin account created.')

			await updateOverrideConfig(instanceDirectory, (config, { merge }) =>
				merge(config, {
					version: '3.7',
					services: { admin: { environment: { CONTEMBER_LOGIN_TOKEN: loginToken } } },
				}),
			)

			adminEnv.CONTEMBER_LOGIN_TOKEN = loginToken
			console.log('Login token and saved to your docker-compose.override.yaml: ' + loginToken)

			if (!nodeAdminRuntime) {
				await execDockerCompose(['-f', '-', 'up', '-d', 'admin'], {
					cwd: instanceDirectory,
					stdin: dump(config),
				})
			}
		}
		if (nodeAdminRuntime) {
			const { output, child } = runCommand('npm', ['run', 'start-admin'], {
				env: adminEnv,
				cwd: process.cwd(),
				stderr: process.stderr,
				stdout: process.stdout,
			})
			output.catch(async e => {
				console.error('Admin failed to start')
				console.error(e)
				await exit()
			})
			console.log(`Admin dev server running on http://127.0.0.1:${adminEnv.CONTEMBER_PORT}`)
		}

		await printInstanceStatus({ instanceDirectory })

		const { child, output } = runDockerCompose(
			['-f', '-', 'logs', '-f', 'api', ...(nodeAdminRuntime ? [] : ['admin'])],
			{
				cwd: instanceDirectory,
				stdin: configYaml,
			},
		)

		let timeoutRef: any = null
		const planPrintInstanceStatus = () => {
			if (timeoutRef) {
				clearTimeout(timeoutRef)
			}
			timeoutRef = setTimeout(async () => {
				await printInstanceStatus({ instanceDirectory })
			}, 2000)
		}
		child.stdout.on('data', () => {
			planPrintInstanceStatus()
		})

		output.catch(e => {
			console.error('Logs command has failed')
		})

		process.stdin.resume()

		await new Promise(resolve => {
			process.stdin.on('exit', resolve)
		})
	}
}
