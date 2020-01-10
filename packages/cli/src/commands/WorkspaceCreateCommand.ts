import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { Input } from '../cli/Input'
import { join } from 'path'
import { createWorkspace } from '../utils/workspace'

type Args = {
	workspaceName: string
}

type Options = {
	['with-admin']: boolean
}

export class WorkspaceCreateCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates a new Contember workspace')
		configuration.argument('workspaceName')
		configuration.option('with-admin').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const [workspaceName] = [input.getArgument('workspaceName')]
		const workspaceDirectory = join(process.cwd(), workspaceName)
		const withAdmin = input.getOption('with-admin')
		await createWorkspace({ workspaceDirectory, withAdmin })

		console.log(`Workspace ${workspaceName} created`)
	}
}
