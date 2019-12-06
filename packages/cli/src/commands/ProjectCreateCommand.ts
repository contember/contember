import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { Input } from '../cli/Input'
import { resolveInstanceListEnvironmentFromInput } from '../utils/instance'
import { createProject, registerProjectToInstance, validateProjectName } from '../utils/project'

type Args = {
	projectName: string
}

type Options = {
	['all-instances']: boolean
	['instance']: string[]
	['no-instance']: boolean
}

export class ProjectCreateCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Creates a new Contember project')
		configuration.argument('projectName')
		configuration.option('instance').valueArray()
		configuration.option('all-instances').valueNone()
		configuration.option('no-instance').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const [projectName] = [input.getArgument('projectName')]
		validateProjectName(projectName)
		const workspaceDirectory = process.cwd()

		const instances = await resolveInstanceListEnvironmentFromInput({ input, workspaceDirectory })

		await createProject({ workspaceDirectory, projectName })
		for (const instance of instances) {
			await registerProjectToInstance({ projectName, ...instance })
		}

		console.log(
			`Project ${projectName} created and registered into following instances: ${instances
				.map(it => it.instanceName)
				.join(', ')}`,
		)
	}
}
