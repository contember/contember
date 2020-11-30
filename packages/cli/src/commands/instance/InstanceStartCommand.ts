import { Command, CommandConfiguration, Input } from '../../cli'
import {
	getInstanceStatus,
	interactiveInstanceConfigure,
	printInstanceStatus,
	resolveInstanceEnvironmentFromInput,
} from '../../utils/instance'
import { DockerCompose, readDefaultDockerComposeConfig } from '../../utils/dockerCompose'
import { runCommand } from '../../utils/commands'

type Args = {
	instanceName: string
}

type Options = {
	['admin-runtime']?: 'node' | 'docker'
	['ports']?: string
	host?: string[]
	['save-ports']?: boolean
	['detach']?: boolean
}

export class InstanceStartCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Starts Contember instance')
		configuration.argument('instanceName').optional()
		configuration.option('host').valueArray()
		configuration //
			.option('save-ports')
			.valueNone()
			.deprecated()
		configuration.option('ports').valueRequired()
		configuration //
			.option('detach')
			.valueNone()
			.shortcut('d')
		configuration //
			.option('admin-runtime')
			.valueRequired()
			.description('"docker" or "node"')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const workspaceDirectory = process.cwd()
		const instanceLocalEnvironment = await resolveInstanceEnvironmentFromInput({ input, workspaceDirectory })

		const composeConfig = await readDefaultDockerComposeConfig(instanceLocalEnvironment.instanceDirectory)
		if (!composeConfig.services) {
			throw 'docker-compose is not configured'
		}

		const { adminEnv } = await interactiveInstanceConfigure({
			composeConfig,
			instanceDirectory: instanceLocalEnvironment.instanceDirectory,
			host: input.getOption('host'),
			ports: input.getOption('ports') ? Number(input.getOption('ports')) : undefined,
		})

		const withAdmin = !!composeConfig.services.admin

		let dockerCompose = new DockerCompose(instanceLocalEnvironment.instanceDirectory)

		const nodeAdminRuntime = withAdmin && input.getOption('admin-runtime') === 'node'
		const mainServices = ['api', ...(!withAdmin || nodeAdminRuntime ? [] : ['admin'])]

		const exit = async () => {
			await dockerCompose.run(['down'], { detached: true }).output
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

		const adminArgs = nodeAdminRuntime ? ['--scale', 'admin=0'] : []
		await dockerCompose.run(['up', '-d', ...adminArgs]).output

		await new Promise(resolve => setTimeout(resolve, 2000))

		const status = await getInstanceStatus(instanceLocalEnvironment)
		const notRunning = status.filter(it => it.name !== 'admin' || !nodeAdminRuntime).filter(it => !it.running)
		if (notRunning.length > 0) {
			const notRunningNames = notRunning.map(it => it.name)
			console.error(`Following services failed to start: ${notRunningNames.join(', ')}`)
			await dockerCompose.run(['logs', ...notRunningNames]).output
			return
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
				await printInstanceStatus(instanceLocalEnvironment)
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
		await printInstanceStatus(instanceLocalEnvironment)

		if (input.getOption('detach')) {
			return
		}

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
