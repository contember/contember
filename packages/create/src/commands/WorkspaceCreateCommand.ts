import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { join } from 'node:path'
import chalk from 'chalk'
import { TemplateInstaller } from '../lib/TemplateInstaller'
import { getPackageVersion } from '../lib/version'

type Args = {
	workspaceName: string
}

type Options = {
}

export class WorkspaceCreateCommand extends Command<Args, Options> {
	constructor(
		private readonly templateInstaller: TemplateInstaller,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates a new Contember workspace')
		configuration.argument('workspaceName')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const workspaceName = input.getArgument('workspaceName')
		const workspaceDirectory = join(process.cwd(), workspaceName)
		await this.templateInstaller.installTemplate('@contember/template-workspace', workspaceDirectory, {
			version: getPackageVersion(),
			projectName: workspaceName,
		})
		// eslint-disable-next-line no-console
		console.log(createDocs(workspaceDirectory, workspaceName))
	}
}

const createDocs = (workspaceDirectory: string, workspaceName: string) => `
Contember workspace was successfully created inside the directory ${workspaceDirectory}

You can now enter this directory:
$ ${chalk.greenBright(`cd ${workspaceName}`)}

Install NPM dependencies:
$ ${chalk.greenBright(`yarn install`)}

And start the Contember stack:
$ ${chalk.greenBright('yarn start')}

The following services will be accessible:

- Contember Admin at http://localhost:1480
- Contember Engine endpoints at http://localhost:1481 (you can authorize with token 0000000000000000000000000000000000000000)
- Adminer database management tool at http://localhost:1485
- Minio local S3 provider at http://localhost:1483 (you can sign in with contember / contember credentials)
- MailHog testing SMTP at http://localhost:1484
- PostgreSQL database at localhost:1482 (you can sign in with contember / contember credentials)

If you have any issues or questions, just ask here: https://github.com/contember/engine/discussions
`
