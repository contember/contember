import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { join } from 'path'
import { createWorkspace } from '../../utils/Workspace'

type Args = {
	workspaceName: string
}

type Options = {
	template?: string
}

export class WorkspaceCreateCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates a new Contember workspace')
		configuration.argument('workspaceName')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const workspaceName = input.getArgument('workspaceName')
		const workspaceDirectory = join(process.cwd(), workspaceName)
		const template = input.getOption('template')
		await createWorkspace({ workspaceDirectory, template })

		console.log(`Workspace ${workspaceName} created`)
	}
}
