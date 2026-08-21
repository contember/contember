import { Command, CommandConfiguration, escapeTerminalText, Input, Output } from '@contember/cli-common'
import { join } from 'node:path'
import chalk from 'chalk'
import { TemplateInstaller } from '../lib/TemplateInstaller.js'
import { getPackageVersion } from '../lib/version.js'
import { detectPackageManager } from '../lib/packageManagerDetector.js'

type Args = {
	projectName: string
}

type Options = {
	template: string
}

export interface WorkspaceCreateResult {
	projectName: string
	projectDirectory: string
	template: string
	packageManager: string
}

export interface WorkspaceCreateRuntime {
	cwd(): string
	getPackageVersion(): Promise<string>
	detectPackageManager(): string
}

const defaultRuntime: WorkspaceCreateRuntime = {
	cwd: () => process.cwd(),
	getPackageVersion,
	detectPackageManager,
}

export class WorkspaceCreateCommand extends Command<Args, Options> {
	constructor(
		private readonly templateInstaller: Pick<TemplateInstaller, 'installTemplate'>,
		private readonly runtime: WorkspaceCreateRuntime = defaultRuntime,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates a new Contember project')
		configuration.argument('projectName')
		configuration.option('template').shortcut('t').valueRequired().description('Template name or remote source')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const projectName = input.getArgument('projectName')
		const projectDirectory = join(this.runtime.cwd(), projectName)
		const packageManager = this.runtime.detectPackageManager()
		const template = input.getOption('template') ?? 'default'

		await this.templateInstaller.installTemplate(template, projectDirectory, {
			version: await this.runtime.getPackageVersion(),
			projectName: projectName,
			packageManager: packageManager,
		})

		const result: WorkspaceCreateResult = { projectName, projectDirectory, template, packageManager }
		output.data(result, {
			human: value => createDocs(value),
			quiet: value => value.projectDirectory,
		})
	}
}

const createDocs = ({ projectDirectory, projectName, packageManager }: WorkspaceCreateResult) => {
	const safeProjectDirectory = escapeTerminalText(projectDirectory)
	const safeProjectName = escapeTerminalText(projectName)
	const safePackageManager = escapeTerminalText(packageManager)
	return `
Contember project successfully created in ${safeProjectDirectory}

Next steps:

1. Navigate to the project directory:
   $ ${chalk.green(`cd ${safeProjectName}`)}

2. Install dependencies:
   $ ${chalk.green(`${safePackageManager} install`)}

3. Start the Contember stack:
   $ ${chalk.green(`${safePackageManager} start`)}

Available services:

${chalk.bold('UI & Admin')}
- Contember Admin         ${chalk.blue('http://localhost:1480')}

${chalk.bold('API & Backend')}
- Contember Engine API    ${chalk.blue('http://localhost:1481')}
  Auth token:             0000000000000000000000000000000000000000

${chalk.bold('Development Tools')}
- PostgreSQL database     ${chalk.blue('http://localhost:1482')}    ${chalk.grey('credentials: contember / contember')}
- S3 object storage       ${chalk.blue('http://localhost:1483')}    ${chalk.grey('credentials: contember / contember')}
- Mailpit SMTP testing    ${chalk.blue('http://localhost:1484')}
- Adminer DB manager      ${chalk.blue('http://localhost:1485')}

${chalk.bold('Need help?')} Ask the community: https://github.com/orgs/contember/discussions
`
}
