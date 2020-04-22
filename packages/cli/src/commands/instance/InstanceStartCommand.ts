import { Command, CommandConfiguration, Input } from '../../cli'
import {
	getInstanceStatus,
	printInstanceStatus,
	readInstanceConfig,
	resolveInstanceDockerConfig,
	resolveInstanceEnvironmentFromInput,
	updateInstanceLocalConfig,
} from '../../utils/instance'
import { DockerCompose, updateOverrideConfig } from '../../utils/dockerCompose'
import { interactiveSetup } from '../../utils/tenant'
import { runCommand } from '../../utils/commands'
import { getWorkspaceApiVersion } from '../../utils/workspace'

type Args = {
	instanceName: string
}

type Options = {
	// ['host']: string
	['admin-runtime']?: 'node' | 'docker'
	['ports']?: string
	host?: string[]
	['save-ports']?: boolean
}

export class InstanceStartCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Starts Contember instance')
		configuration.argument('instanceName').optional()
		configuration.option('host').valueArray()
		configuration.option('save-ports').valueNone()
		configuration.option('ports').valueRequired()
		configuration
			.option('admin-runtime')
			.valueRequired()
			.description('"docker" or "node"')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const workspaceDirectory = process.cwd()
		const { instanceDirectory } = await resolveInstanceEnvironmentFromInput({ input, workspaceDirectory })
		const { composeConfig, portsMapping } = await resolveInstanceDockerConfig({
			instanceDirectory,
			host: input.getOption('host'),
			startPort: input.getOption('ports') ? Number(input.getOption('ports')) : undefined,
			savePortsMapping: input.getOption('save-ports'),
		})
		const version = await getWorkspaceApiVersion({ workspaceDirectory })

		let dockerCompose = new DockerCompose(instanceDirectory, composeConfig, {
			env: {
				CONTEMBER_VERSION: version || '0',
			},
		})

		const withAdmin = !!composeConfig.services.admin
		const adminEnv = !withAdmin ? {} : { ...composeConfig.services.admin.environment }

		const nodeAdminRuntime = withAdmin && input.getOption('admin-runtime') === 'node'
		if (nodeAdminRuntime) {
			delete composeConfig.services.admin
		}
		const mainServices = ['api', ...(!withAdmin || nodeAdminRuntime ? [] : ['admin'])]

		const exit = async () => {
			await dockerCompose.run(['down']).output
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

		await dockerCompose.run(['stop', ...mainServices]).output
		await dockerCompose.run(['rm', '-f', ...mainServices]).output
		await dockerCompose.run(['up', '-d']).output

		await new Promise(resolve => setTimeout(resolve, 2000))

		const status = await getInstanceStatus({ instanceDirectory })
		const notRunning = status.filter(it => it.name !== 'admin' || !nodeAdminRuntime).filter(it => !it.running)
		if (notRunning.length > 0) {
			const notRunningNames = notRunning.map(it => it.name)
			console.error(`Following services failed to start: ${notRunningNames.join(', ')}`)
			await dockerCompose.run(['logs', ...notRunningNames]).output
			return
		}

		const instanceConfig = await readInstanceConfig({ instanceDirectory })
		const updateLocalConfigLoginToken = async (loginToken: string) =>
			await updateInstanceLocalConfig({
				instanceDirectory,
				updater: data => ({ ...data, loginToken }),
			})
		if (!instanceConfig.loginToken && adminEnv.CONTEMBER_LOGIN_TOKEN) {
			await updateLocalConfigLoginToken(adminEnv.CONTEMBER_LOGIN_TOKEN)
			instanceConfig.loginToken = adminEnv.CONTEMBER_LOGIN_TOKEN
		} else if (!instanceConfig.loginToken) {
			console.log('It seems that this is first run of this instance. Will try to execute a setup.')
			console.log('If that is not true, please fill your login token to a contember.instance.local.yaml')

			const server = `http://127.0.0.1:${portsMapping.api[0].hostPort}`
			const { loginToken } = await interactiveSetup(server)

			if (withAdmin) {
				await updateOverrideConfig(instanceDirectory, (config, { merge }) =>
					merge(config, {
						version: '3.7',
						services: { admin: { environment: { CONTEMBER_LOGIN_TOKEN: loginToken } } },
					}),
				)
			}
			await updateLocalConfigLoginToken(loginToken)
			instanceConfig.loginToken = loginToken

			adminEnv.CONTEMBER_LOGIN_TOKEN = loginToken
			console.log('Login token and saved to your contember.instance.local.yaml: ' + loginToken)

			if (withAdmin && !nodeAdminRuntime) {
				dockerCompose = dockerCompose.withService('admin', {
					...dockerCompose.config.services.admin,
					environment: adminEnv,
				})
				await dockerCompose.run(['up', '-d', 'admin']).output
			}
		}
		let timeoutRef: any = null
		let start = Date.now()
		const printNodeAdminStatus = () => {
			if (!nodeAdminRuntime) {
				return
			}
			console.log(`admin: running on http://127.0.0.1:${adminEnv.CONTEMBER_PORT}`)
		}

		const planPrintInstanceStatus = () => {
			if (Date.now() - start > 60 * 1000) {
				return
			}
			if (timeoutRef) {
				clearTimeout(timeoutRef)
			}
			timeoutRef = setTimeout(async () => {
				await printInstanceStatus({ instanceDirectory })
				printNodeAdminStatus()
			}, 2000)
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
			child.stdout.on('data', () => {
				planPrintInstanceStatus()
			})
		}

		printNodeAdminStatus()
		await printInstanceStatus({ instanceDirectory })

		const { child, output } = dockerCompose.run(['logs', '-f', ...mainServices])

		child.stdout.on('data', () => {
			planPrintInstanceStatus()
		})

		output.catch(() => {})

		process.stdin.resume()

		await new Promise(resolve => {
			process.stdin.on('exit', resolve)
		})
	}
}
