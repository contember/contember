import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { Workspace, validateProjectName } from '@contember/cli-common'

type Args = {
	project: string
}

type Options = {
	template: string
}

export class ProjectCreateCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates a new Contember project')
		configuration.argument('project')
		configuration.option('template').valueRequired()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const [projectName] = [input.getArgument('project')]
		validateProjectName(projectName)
		const workspace = await Workspace.get(process.cwd())

		const template = input.getOption('template')
		const project = await workspace.projects.createProject(projectName, { template })
		await project.register()

		console.log(`Project ${projectName} created`)
	}
}
