import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { Input } from '../cli/Input'
import { join } from 'path'
import { resourcesDir } from '../pathUtils'
import { copy } from 'fs-extra'
import { createInstance } from '../utils/instance'
import { createProject, registerProjectToInstance } from '../utils/project'

type Args = {
	workspaceName: string
}

type Options = {}

export class WorkspaceCreateCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Creates a new Contember workspace')
		configuration.argument('workspaceName')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const [workspaceName] = [input.getArgument('workspaceName')]
		const workspaceDirectory = join(process.cwd(), workspaceName)
		await copy(join(resourcesDir, './workspace-template'), workspaceDirectory)

		const instance = await createInstance({ workspaceDirectory, instanceName: 'default' })
		await createProject({ workspaceDirectory, projectName: 'sandbox' })
		await registerProjectToInstance({ projectName: 'sandbox', ...instance })

		console.log(`Workspace ${workspaceName} created`)
	}
}
