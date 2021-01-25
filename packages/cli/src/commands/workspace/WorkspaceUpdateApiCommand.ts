import { Command, CommandConfiguration, Input } from '../../cli'
import { join } from 'path'
import { Workspace } from '../../utils/Workspace'
import { runCommand } from '../../utils/commands'
import { updateMainDockerComposeConfig } from '../../utils/dockerCompose'
import { pathExists } from 'fs-extra'
import { updateNpmPackages } from '../../utils/npm'

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
		const workspace = await Workspace.get(process.cwd())
		const upgradablePackages = ['@contember/schema', '@contember/schema-definition', '@contember/cli']

		await updateNpmPackages(
			upgradablePackages.map(it => ({ name: it, version })),
			workspace.directory,
		)
		const prevVersion = workspace.apiVersion
		if (await workspace.updateApiVersion(version)) {
			console.log('contember.workspace.yaml updated')
		} else {
			console.log('contember.workspace.yaml not found, skipping')
		}
		const instances = await workspace.instances.listInstances()
		console.log('Updating instance docker-compose')
		for (const instance of instances) {
			await updateMainDockerComposeConfig(instance.directory, (data: any) => {
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
