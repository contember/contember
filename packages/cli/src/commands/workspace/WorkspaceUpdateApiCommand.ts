import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { Workspace } from '@contember/cli-common'
import { updateMainDockerComposeConfig } from '@contember/cli-common'
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
		console.log('Updating docker-compose')
		await updateMainDockerComposeConfig(workspace.directory, (data: any) => {
			const apiServiceName = data.services?.['contember'] ? 'contember' : 'api'
			if (!data.services?.[apiServiceName]) {
				console.log(`docker-compose.yaml file not found, skipping`)
				return
			}
			const expectedImage = `contember/contember:${prevVersion}`
			if (data.services[apiServiceName].image !== expectedImage) {
				console.log(
					`API image in docker-compose.yaml file is ${data.services[apiServiceName].image}, but ${expectedImage} is expected. Skipping`,
				)
				return data
			}

			return {
				...data,
				services: {
					...data.services,
					[apiServiceName]: {
						...data.services?.[apiServiceName],
						image: `contember/contember:${version}`,
					},
				},
			}
		})
		console.log('API update successful')
	}
}
