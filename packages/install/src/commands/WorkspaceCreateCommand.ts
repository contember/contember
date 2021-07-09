import { createWorkspace, Command, CommandConfiguration, Input } from '@contember/cli-common'
import { join } from 'path'

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

		console.log(`Contember workspace was successfully created in directory ${workspaceDirectory}.`)
		console.log('')
		console.log(`You can now enter this directory:`)
		console.log(`$ cd ${workspaceName}`)
		console.log('')
		console.log(
			'Before running the API, you must configure docker-compose stack by creating a docker-compose.override.yaml configuration file.',
		)
		console.log('')
		console.log('You can either use a template file docker-compose.override.dist.yaml:')
		console.log('$ cp docker-compose.override.dist.yaml docker-compose.override.yaml')
		console.log(`(don't forget to check if the configuration matches your needs)`)
		console.log('')
		console.log('You are now ready to start the Contember stack:')
		console.log('$ docker-compose up')
		console.log('')
		console.log('Contember API will be published on a configured port (the default is 1481).')
		console.log('')
		console.log(
			'There is a sandbox project with a minimal model with a GraphQL endpoint located at http://localhost:1481/content/sandbox/live',
		)
		console.log(
			'To connect to the GraphQL you can use pre-packed client (Apollo Playground) available at http://localhost:1481/playground',
		)
		console.log(
			'At http://localhost:1481/sandbox there is also the Playground with some prepared GraphQL queries you can immediately run against the API.',
		)
		console.log('')
		console.log(
			'If you have any issues or questions, just ask here: https://github.com/contember/contember/discussions',
		)
	}
}
