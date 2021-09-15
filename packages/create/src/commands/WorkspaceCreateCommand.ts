import { createWorkspace, Command, CommandConfiguration, Input } from '@contember/cli-common'
import { join } from 'path'
import chalk from 'chalk'
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
		await createWorkspace({ workspaceDirectory, workspaceName, template })
		// eslint-disable-next-line no-console
		console.log(createDocs(workspaceDirectory, workspaceName))
	}
}

const createDocs = (workspaceDirectory: string, workspaceName: string) => `
Contember workspace was successfully created inside the directory ${workspaceDirectory}

You can now enter this directory:
$ ${chalk.greenBright(`cd ${workspaceName}`)}

Install NPM dependencies:
$ ${chalk.greenBright(`npm install`)}
(of course, you can use any alternative package manager like pnpm or yarn)

Check the default configuration in docker-compose.override.yaml if it fits your needs.

Now you are ready to start the Contember stack:
$ ${chalk.greenBright('docker-compose up')}

The following services are now be accessible (with default settings):

- Admin at http://localhost:1480
- API endpoints at http://localhost:1481 (you can authorize with token 0000000000000000000000000000000000000000)
	- To connect to the GraphQL you can use pre-packed client (Apollo Playground) available at http://localhost:1481/playground
- Adminer database management tool at http://localhost:1485
- Minio local S3 provider at http://localhost:1483 (you can sign in with contembeer / contember credentials)
- Mailhog testing SMTP at http://localhost:1484
- PostgreSQL database at localhost:1482 (you can sign in with contember / contember credentials)

If you have any issues or questions, just ask here: https://github.com/contember/engine/discussions
`
