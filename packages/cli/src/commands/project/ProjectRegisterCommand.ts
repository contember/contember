import { Command, CommandConfiguration, Input } from '../../cli'
import { resolveInstanceListEnvironmentFromInput } from '../../utils/instance'
import { Workspace } from '../../utils/Workspace'

type Args = {
	projectName: string
}

type Options = {
	['all-instances']: boolean
	['instance']: string[]
	['no-instance']: boolean
}

export class ProjectRegisterCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Registers a project to an instance')
		configuration.argument('projectName')
		configuration.option('instance').valueArray()
		configuration.option('all-instances').valueNone()
		configuration.option('no-instance').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const [projectName] = [input.getArgument('projectName')]
		const workspace = await Workspace.get(process.cwd())
		const project = await workspace.projects.getProject(projectName)
		const instances = await resolveInstanceListEnvironmentFromInput({ input, workspace })
		for (const instance of instances) {
			await project.registerToInstance(instance)
		}

		console.log(
			`Project ${projectName} registered into following instances: ${instances.map(it => it.name).join(', ')}`,
		)
	}
}
