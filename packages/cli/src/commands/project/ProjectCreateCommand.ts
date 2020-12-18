import { Command, CommandConfiguration, Input } from '../../cli'
import { resolveInstanceListEnvironmentFromInput } from '../../utils/instance'
import { validateProjectName } from '../../utils/Project'
import { Workspace } from '../../utils/Workspace'

type Args = {
	projectName: string
}

type Options = {
	['all-instances']: boolean
	['instance']: string[]
	['no-instance']: boolean
	template: string
}

export class ProjectCreateCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates a new Contember project')
		configuration.argument('projectName')
		configuration.option('instance').valueArray()
		configuration.option('all-instances').valueNone()
		configuration.option('no-instance').valueNone()
		configuration.option('template').valueRequired()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const [projectName] = [input.getArgument('projectName')]
		validateProjectName(projectName)
		const workspace = await Workspace.get(process.cwd())

		const instances = await resolveInstanceListEnvironmentFromInput({ input, workspace })

		const template = input.getOption('template')
		const project = await workspace.projects.createProject(projectName, { template })
		for (const instance of instances) {
			await project.registerToInstance(instance)
		}

		console.log(
			`Project ${projectName} created and registered into following instances: ${instances
				.map(it => it.name)
				.join(', ')}`,
		)
	}
}
