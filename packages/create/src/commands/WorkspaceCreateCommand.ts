import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { join } from 'node:path'
import chalk from 'chalk'
import { TemplateInstaller } from '../lib/TemplateInstaller'
import { getPackageVersion } from '../lib/version'
import { detectPackageManager } from '../lib/packageManagerDetector'

type Args = {
	projectName: string
}

type Options = {
	template: string
}

export class WorkspaceCreateCommand extends Command<Args, Options> {
	constructor(
		private readonly templateInstaller: TemplateInstaller,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates a new Contember project')
		configuration.argument('projectName')
		configuration.option('template').shortcut('t')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const projectName = input.getArgument('projectName')
		const projectDirectory = join(process.cwd(), projectName)
		const packageManager = detectPackageManager()

		await this.templateInstaller.installTemplate(input.getOption('template') ?? 'default', projectDirectory, {
			version: await getPackageVersion(),
			projectName: projectName,
			packageManager: packageManager,
		})

		// eslint-disable-next-line no-console
		console.log(createDocs(projectDirectory, projectName, packageManager))
	}
}

const createDocs = (projectDirectory: string, projectName: string, packageManager: string) => `
Contember project successfully created in ${projectDirectory}

Next steps:

1. Navigate to the project directory:
   $ ${chalk.green(`cd ${projectName}`)}

2. Install dependencies:
   $ ${chalk.green(`${packageManager} install`)}

3. Start the Contember stack:
   $ ${chalk.green(`${packageManager} start`)}

Available services:

${chalk.bold('UI & Admin')}
- Contember Admin         ${chalk.blue('http://localhost:1480')}

${chalk.bold('API & Backend')}
- Contember Engine API    ${chalk.blue('http://localhost:1481')}
  Auth token:             0000000000000000000000000000000000000000

${chalk.bold('Development Tools')}
- PostgreSQL database     ${chalk.blue('http://localhost:1482')}    ${chalk.grey('credentials: contember / contember')}
- Minio S3 storage        ${chalk.blue('http://localhost:1483')}
- Mailpit SMTP testing    ${chalk.blue('http://localhost:1484')}
- Adminer DB manager      ${chalk.blue('http://localhost:1485')}
- Minio Dashboard         ${chalk.blue('http://localhost:1486')}    ${chalk.grey('credentials: contember / contember')}

${chalk.bold('Need help?')} Ask the community: https://github.com/orgs/contember/discussions
`
