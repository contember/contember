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

And start the Contember stack:
$ ${chalk.greenBright('npm start')}

The following services will be accessible:

- Contember Admin at http://localhost:1480
- Contember Engine endpoints at http://localhost:1481 (you can authorize with token 0000000000000000000000000000000000000000)
- Adminer database management tool at http://localhost:1485
- Minio local S3 provider at http://localhost:1483 (you can sign in with contember / contember credentials)
- MailHog testing SMTP at http://localhost:1484
- PostgreSQL database at localhost:1482 (you can sign in with contember / contember credentials)

If you have any issues or questions, just ask here: https://github.com/contember/engine/discussions
`
