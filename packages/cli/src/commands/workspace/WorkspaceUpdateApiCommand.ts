import { Command, CommandConfiguration, Input } from '../../cli'
import { join } from 'path'
import { createWorkspace, getWorkspaceApiVersion, updateWorkspaceApiVersion } from '../../utils/workspace'
import { runCommand } from '../../utils/commands'
import { listInstances, resolveInstanceEnvironment } from '../../utils/instance'
import { updateMainDockerComposeConfig } from '../../utils/dockerCompose'

type Args = {
	version: string
}

type Options = {}

export class WorkspaceUpdateApiCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Updates contember API version and all related packages')
		configuration.argument('version')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const version = input.getArgument('version')
		const workspaceDirectory = process.cwd()
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const packageJson = require(join(workspaceDirectory, 'package.json')) as any
		const upgradablePackages = ['@contember/schema', '@contember/schema-definition', '@contember/cli']
		const upgradeDeps = async (type: 'dependencies' | 'devDependencies') => {
			const packages = Object.keys(packageJson[type])
				.filter(it => upgradablePackages.includes(it))
				.map(it => `${it}@${version}`)
			if (packages.length === 0) {
				console.log(`No npm ${type} to update.`)
				return
			}
			console.log(`Updating npm ${type}: ${packages.join(', ')}`)
			const { output } = runCommand(
				'npm',
				['install', type === 'devDependencies' ? '--save-dev' : '--save', ...packages],
				{
					cwd: workspaceDirectory,
					stderr: process.stderr,
					stdout: process.stdout,
				},
			)
			await output
			console.log('npm update done')
		}
		await upgradeDeps('dependencies')
		await upgradeDeps('devDependencies')
		const prevVersion = await getWorkspaceApiVersion({ workspaceDirectory })
		if (await updateWorkspaceApiVersion({ workspaceDirectory, version })) {
			console.log('contember.workspace.yaml updated')
		} else {
			console.log('contember.workspace.yaml not found, skipping')
		}
		const instances = await listInstances({ workspaceDirectory })
		console.log('Updating instance docker-compose')
		for (const instance of instances) {
			const instanceEnv = await resolveInstanceEnvironment({ workspaceDirectory, instanceName: instance })
			await updateMainDockerComposeConfig(instanceEnv.instanceDirectory, (data: any) => {
				if (!data.services?.api) {
					console.log(`docker-compose.yaml file in instance ${instance} not found, skipping`)
					return
				}
				const expectedImage = `contember/contember:${prevVersion}`
				if (data.services.api.image !== expectedImage) {
					console.log(
						`API image in docker-compose.yaml file in instance ${instance} is ${data.services.api.image}, but ${expectedImage} is expected. Skipping`,
					)
					return data
				}

				return {
					...data,
					services: {
						...data.services,
						api: {
							...data.services.api,
							image: `contember/contember:${version}`,
						},
					},
				}
			})
		}
		console.log('API update successful')
	}
}
