import { Command, CommandConfiguration, Input, PackageWorkspaceResolver } from '@contember/cli-common'
import { DockerComposeManager } from '../../lib/fs/DockerComposeManager'
import { contemberDockerImages } from '../../consts'

type Args = {
	version: string
}

type Options = {}

export class WorkspaceUpdateApiCommand extends Command<Args, Options> {
	constructor(
		private readonly packageWorkspaceResolver: PackageWorkspaceResolver,
		private readonly dockerComposeManager: DockerComposeManager,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Updates Contember API version and all related packages')
		configuration.argument('version')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const version = input.getArgument('version')
		const packageWorkspace = await this.packageWorkspaceResolver.resolve()

		await packageWorkspace.updateEverywhere({
			'@contember/schema': version,
			'@contember/schema-definition': version,
			'@contember/cli': version,
		})

		console.log('Updating docker-compose')
		const getNewImage = (currentImage: string): string | null => {
			for (const candidate of contemberDockerImages) {
				if (currentImage.startsWith(`${candidate}:`)) {
					return `${candidate.replace(/-ee$/, '')}:${version}`
				}
			}
			return null
		}
		await this.dockerComposeManager.updateMainDockerComposeConfig(data => ({
			...data,
			services: Object.fromEntries(Object.entries(data?.services ?? {}).map(([name, service]: [string, any]) => {
				const newImage = getNewImage(service.image)
				if (newImage) {
					console.log(`docker-compose service ${name} updated`)
					return [
						name,
						{
							...service,
							image: newImage,
						},
					]
				}
				return [name, service]
			})),
		}))
		console.log('API versions updated')
		console.log('Restart server to apply changes')
	}
}
